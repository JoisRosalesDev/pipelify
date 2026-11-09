import sys
import os
import time
import json
import statistics

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.services.executor import data_plane_executor

def run_data_plane_benchmark():
    print("=" * 75)
    print("  PIPELIFY — BENCHMARK CUANTITATIVO DEL DATA PLANE (DUCKDB)")
    print("=" * 75)
    
    batch_sizes = [10_000, 50_000, 100_000, 250_000]
    
    print(f"{'Lote (Filas)':<15} | {'Extracción':<15} | {'Transformación':<15} | {'Throughput':<18} | {'Total (s)':<10}")
    print("-" * 75)
    
    results = []

    for batch in batch_sizes:
        exec_id = f"bench-duckdb-{batch}"
        t_total_start = time.perf_counter()
        
        # 1. Extractor
        res_ext = data_plane_executor.execute_node(
            exec_id,
            {"id": "ext-1", "data": {"type": "extractor", "config": {"batch_size": batch}}}
        )
        ext_ms = res_ext["execution_time_ms"]
        
        # 2. Transformer (SQL Aggregations: GROUP BY, SUM, AVG, WHERE filter)
        res_trans = data_plane_executor.execute_node(
            exec_id,
            {"id": "trans-1", "data": {"type": "transformer", "config": {}}},
            upstream_nodes=["ext-1"]
        )
        trans_ms = res_trans["execution_time_ms"]
        
        # 3. Loader
        res_load = data_plane_executor.execute_node(
            exec_id,
            {"id": "load-1", "data": {"type": "loader", "config": {}}},
            upstream_nodes=["trans-1"]
        )
        load_ms = res_load["execution_time_ms"]
        
        total_s = time.perf_counter() - t_total_start
        throughput_rows_sec = int(batch / total_s) if total_s > 0 else 0
        
        results.append({
            "batch": batch,
            "ext_ms": ext_ms,
            "trans_ms": trans_ms,
            "load_ms": load_ms,
            "total_s": total_s,
            "throughput": throughput_rows_sec,
            "preview": res_trans["preview"]
        })
        
        print(f"{batch:<15,d} | {ext_ms:>6d} ms       | {trans_ms:>6d} ms       | {throughput_rows_sec:>10,d} filas/s | {total_s:>8.3f}s")
        data_plane_executor.close_session(exec_id)

    print("-" * 75)
    print("\n[Muestra del Dataset Analítico Resultante en DuckDB]:")
    print(json.dumps(results[-1]["preview"], indent=2, default=str))
    print("\n" + "=" * 75)
    print("  FIN DEL BENCHMARK")
    print("=" * 75)

if __name__ == "__main__":
    run_data_plane_benchmark()
