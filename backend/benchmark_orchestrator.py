import asyncio
import statistics
import time
from typing import Any, Dict, List
import httpx

BASE_URL = "https://fastapi-cn1w.onrender.com"

# Sample 3-node valid DAG: Extractor -> Transformer -> Loader
VALID_DAG = {
    "pipeline_id": "benchmark-valid-dag",
    "nodes": [
        {
            "id": "node-1",
            "type": "customNode",
            "position": {"x": 100.0, "y": 100.0},
            "data": {
                "label": "Extractor Node",
                "type": "extractor",
                "config": {"batch_size": 1000}
            }
        },
        {
            "id": "node-2",
            "type": "customNode",
            "position": {"x": 300.0, "y": 100.0},
            "data": {
                "label": "Transformer Node",
                "type": "transformer",
                "config": {"batch_size": 1000}
            }
        },
        {
            "id": "node-3",
            "type": "customNode",
            "position": {"x": 500.0, "y": 100.0},
            "data": {
                "label": "Loader Node",
                "type": "loader",
                "config": {"batch_size": 1000}
            }
        }
    ],
    "edges": [
        {"id": "e1-2", "source": "node-1", "target": "node-2"},
        {"id": "e2-3", "source": "node-2", "target": "node-3"}
    ]
}

# Cyclic DAG: Node 1 -> Node 2 -> Node 3 -> Node 1 (Must fail via Kahn's Algorithm)
CYCLIC_DAG = {
    "pipeline_id": "benchmark-cyclic-dag",
    "nodes": [
        {
            "id": "c-1",
            "type": "customNode",
            "position": {"x": 100.0, "y": 100.0},
            "data": {"label": "C1", "type": "extractor", "config": {}}
        },
        {
            "id": "c-2",
            "type": "customNode",
            "position": {"x": 300.0, "y": 100.0},
            "data": {"label": "C2", "type": "transformer", "config": {}}
        },
        {
            "id": "c-3",
            "type": "customNode",
            "position": {"x": 500.0, "y": 100.0},
            "data": {"label": "C3", "type": "loader", "config": {}}
        }
    ],
    "edges": [
        {"id": "ce1-2", "source": "c-1", "target": "c-2"},
        {"id": "ce2-3", "source": "c-2", "target": "c-3"},
        {"id": "ce3-1", "source": "c-3", "target": "c-1"}
    ]
}

# Faulty DAG: Injects force_fail to test Backoff & Circuit Breaker
FAULTY_DAG = {
    "pipeline_id": "benchmark-faulty-dag",
    "nodes": [
        {
            "id": "f-1",
            "type": "customNode",
            "position": {"x": 100.0, "y": 100.0},
            "data": {
                "label": "Failing Node",
                "type": "extractor",
                "config": {"force_fail": True}
            }
        },
        {
            "id": "f-2",
            "type": "customNode",
            "position": {"x": 300.0, "y": 100.0},
            "data": {"label": "Downstream Node", "type": "transformer", "config": {}}
        }
    ],
    "edges": [
        {"id": "fe1-2", "source": "f-1", "target": "f-2"}
    ]
}


async def benchmark_ingestion_latency(client: httpx.AsyncClient, iterations: int = 10) -> Dict[str, float]:
    latencies: List[float] = []
    print(f"\n[1/4] Evaluando latencia de ingesta HTTP 202 ({iterations} iteraciones)...")
    
    for i in range(iterations):
        payload = dict(VALID_DAG)
        payload["pipeline_id"] = f"bench-ingest-{i}"
        
        t0 = time.perf_counter()
        res = await client.post(f"{BASE_URL}/api/v1/executions", json=payload)
        t1 = time.perf_counter()
        
        elapsed_ms = (t1 - t0) * 1000.0
        if res.status_code == 202:
            latencies.append(elapsed_ms)
        else:
            print(f"  [WARN] Request {i} falló con status {res.status_code}: {res.text}")

    if not latencies:
        return {"error": "Todas las peticiones fallaron"}

    p50 = statistics.median(latencies)
    mean = statistics.mean(latencies)
    p95 = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else max(latencies)
    min_lat = min(latencies)
    max_lat = max(latencies)

    print(f"  -> Min: {min_lat:.1f}ms | Avg: {mean:.1f}ms | P50: {p50:.1f}ms | Max/P95: {p95:.1f}ms")
    return {"min_ms": min_lat, "avg_ms": mean, "p50_ms": p50, "p95_ms": p95, "max_ms": max_lat}


async def test_cyclic_dag(client: httpx.AsyncClient) -> bool:
    print("\n[2/4] Probando detección de ciclos (Kahn's Algorithm)...")
    res = await client.post(f"{BASE_URL}/api/v1/executions", json=CYCLIC_DAG)
    if res.status_code != 202:
        print(f"  [ERROR] Ingesta falló: {res.status_code} {res.text}")
        return False
    
    exec_id = res.json()["execution_id"]
    print(f"  -> Ejecución iniciada: {exec_id}. Esperando resolución...")
    
    # Poll execution status
    for _ in range(10):
        await asyncio.sleep(0.5)
        poll = await client.get(f"{BASE_URL}/api/v1/executions/{exec_id}")
        if poll.status_code == 200:
            data = poll.json()
            status = data.get("status")
            if status == "FAILED":
                error_summary = data.get("error_summary", "")
                print(f"  [OK] DAG cíclico rechazado correctamente como FAILED.")
                print(f"       Detalle: {error_summary}")
                return "ciclos" in error_summary.lower() or "dag" in error_summary.lower()
            elif status in ("COMPLETED",):
                print(f"  [FAIL] ¡El DAG cíclico fue marcado como COMPLETED indebidamente!")
                return False
    print("  [TIMEOUT] El estado no se resolvió a tiempo.")
    return False


async def test_circuit_breaker(client: httpx.AsyncClient) -> bool:
    print("\n[3/4] Probando Circuit Breaker y Reintentos con Backoff...")
    res = await client.post(f"{BASE_URL}/api/v1/executions", json=FAULTY_DAG)
    if res.status_code != 202:
        print(f"  [ERROR] Ingesta falló: {res.status_code} {res.text}")
        return False
    
    exec_id = res.json()["execution_id"]
    print(f"  -> Ejecución iniciada: {exec_id}. Esperando que fallen los reintentos...")
    
    t0 = time.perf_counter()
    for _ in range(25):
        await asyncio.sleep(1.0)
        poll = await client.get(f"{BASE_URL}/api/v1/executions/{exec_id}")
        if poll.status_code == 200:
            data = poll.json()
            status = data.get("status")
            if status == "FAILED":
                elapsed = time.perf_counter() - t0
                print(f"  [OK] Pipeline abortado como FAILED en {elapsed:.1f}s.")
                nodes = data.get("node_executions", [])
                for n in nodes:
                    print(f"       Nodo {n.get('node_id')}: status={n.get('status')}, intentos={n.get('attempt_count')}")
                return True
    return False


async def test_full_pipeline_run(client: httpx.AsyncClient) -> Dict[str, Any]:
    print("\n[4/4] Ejecutando pipeline válido completo de 3 nodos...")
    t0 = time.perf_counter()
    res = await client.post(f"{BASE_URL}/api/v1/executions", json=VALID_DAG)
    exec_id = res.json()["execution_id"]
    
    for _ in range(20):
        await asyncio.sleep(0.5)
        poll = await client.get(f"{BASE_URL}/api/v1/executions/{exec_id}")
        if poll.status_code == 200:
            data = poll.json()
            if data.get("status") == "COMPLETED":
                total_time = time.perf_counter() - t0
                print(f"  [OK] Pipeline completado en {total_time:.2f}s total.")
                for n in data.get("node_executions", []):
                    metrics = n.get("output_data") or {}
                    print(f"       Nodo {n.get('node_id')}: {metrics.get('processed_records', 0)} registros en {metrics.get('execution_time_ms', 0)}ms")
                return {"completed": True, "total_time_s": total_time}
    return {"completed": False}


async def main():
    print("=" * 70)
    print("  PIPELIFY — BENCHMARK DE CONTROL PLANE (LINEA BASE)")
    print(f"  Target: {BASE_URL}")
    print("=" * 70)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Check health
        h = await client.get(f"{BASE_URL}/health")
        print(f"Estado del servicio: {h.json()}")
        
        await benchmark_ingestion_latency(client, iterations=10)
        await test_cyclic_dag(client)
        await test_circuit_breaker(client)
        await test_full_pipeline_run(client)

    print("\n" + "=" * 70)
    print("  FIN DEL BENCHMARK")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
