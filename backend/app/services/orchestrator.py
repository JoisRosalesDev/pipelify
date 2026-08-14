import asyncio
import logging
import random
from collections import deque
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import publish_execution_event_async
from app.db.session import AsyncSessionLocal
from app.models.execution import (
    ExecutionStatus,
    PipelineExecutionModel,
    PipelineNodeExecutionModel,
)

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """
    Orquestador principal del ciclo de vida de ejecuciones ETL.
    Gestiona la máquina de estados PostgreSQL (PENDING -> RUNNING -> COMPLETED/FAILED),
    reintentos con Backoff Exponencial y Jitter, Circuit Breaker y la transmisión
    de eventos en tiempo real mediante Redis Pub/Sub.
    """

    MAX_RETRIES: int = 3
    CIRCUIT_BREAKER_THRESHOLD: float = 0.5  # Detener si falla > 50% de nodos procesados

    async def execute_pipeline(self, execution_id: UUID) -> Dict[str, Any]:
        """
        Punto de entrada asíncrono para ejecutar un pipeline dado su execution_id.
        """
        async with AsyncSessionLocal() as db:
            # 1. Cargar la ejecución desde PostgreSQL
            stmt = select(PipelineExecutionModel).where(PipelineExecutionModel.id == execution_id)
            result = await db.execute(stmt)
            execution = result.scalar_one_or_none()

            if not execution:
                logger.error(f"Ejecución no encontrada en la base de datos: {execution_id}")
                return {"status": "FAILED", "error": "Ejecución no encontrada en la base de datos"}

            # 2. Transición atómica de PENDING -> RUNNING
            execution.status = ExecutionStatus.RUNNING
            execution.started_at = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(execution)

            logger.info(f"Transición a RUNNING para la ejecución: {execution_id}")

            # 3. Publicar evento EXECUTION_STARTED en Redis Pub/Sub
            await publish_execution_event_async(
                str(execution_id),
                {
                    "event": "EXECUTION_STARTED",
                    "execution_id": str(execution_id),
                    "node_id": None,
                    "status": ExecutionStatus.RUNNING.value,
                    "metrics": {"total_nodes": len(execution.dag_snapshot.get("nodes", []))},
                    "error_message": None,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

            # 4. Ordenar nodos según el Grafo Acíclico Dirigido (DAG)
            dag = execution.dag_snapshot
            nodes_list = dag.get("nodes", [])
            edges_list = dag.get("edges", [])

            sorted_nodes, topological_error = self._topological_sort(nodes_list, edges_list)
            if topological_error:
                execution.status = ExecutionStatus.FAILED
                execution.error_summary = topological_error
                execution.finished_at = datetime.now(timezone.utc)
                await db.commit()

                await publish_execution_event_async(
                    str(execution_id),
                    {
                        "event": "EXECUTION_FINISHED",
                        "execution_id": str(execution_id),
                        "node_id": None,
                        "status": ExecutionStatus.FAILED.value,
                        "metrics": None,
                        "error_message": topological_error,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                return {"status": "FAILED", "error": topological_error}

            # 5. Ejecutar nodos en secuencia con Resiliencia (Backoff + Jitter + Circuit Breaker)
            processed_count = 0
            failed_count = 0

            for node in sorted_nodes:
                node_id = node.get("id")
                node_data = node.get("data", {})
                node_type = node_data.get("type", "processor")

                # Verificación del Circuit Breaker antes de iniciar el nodo
                if processed_count > 0 and (failed_count / processed_count) > self.CIRCUIT_BREAKER_THRESHOLD:
                    cb_msg = f"Circuit Breaker activado: la tasa de fallos alcanzó {(failed_count / processed_count) * 100:.1f}% (>50%)."
                    logger.warning(cb_msg)
                    execution.status = ExecutionStatus.FAILED
                    execution.error_summary = cb_msg
                    execution.finished_at = datetime.now(timezone.utc)
                    await db.commit()

                    await publish_execution_event_async(
                        str(execution_id),
                        {
                            "event": "EXECUTION_FINISHED",
                            "execution_id": str(execution_id),
                            "node_id": node_id,
                            "status": ExecutionStatus.FAILED.value,
                            "metrics": {"processed_nodes": processed_count, "failed_nodes": failed_count},
                            "error_message": cb_msg,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    return {"status": "FAILED", "error": cb_msg}

                # Crear o buscar registro de ejecución de nodo
                node_exec = await self._get_or_create_node_execution(
                    db, execution_id, node_id, node_type
                )
                node_exec.status = ExecutionStatus.RUNNING
                node_exec.started_at = datetime.now(timezone.utc)
                await db.commit()

                # Evento NODE_UPDATED -> RUNNING
                await publish_execution_event_async(
                    str(execution_id),
                    {
                        "event": "NODE_UPDATED",
                        "execution_id": str(execution_id),
                        "node_id": node_id,
                        "status": ExecutionStatus.RUNNING.value,
                        "metrics": {"node_label": node_data.get("label", node_id)},
                        "error_message": None,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )

                # Intentar ejecución del nodo con Exponential Backoff y Jitter
                success, node_metrics, last_error = await self._execute_node_with_retries(
                    db, node_exec, node
                )

                processed_count += 1

                if success:
                    node_exec.status = ExecutionStatus.COMPLETED
                    node_exec.finished_at = datetime.now(timezone.utc)
                    node_exec.output_data = node_metrics
                    await db.commit()

                    # Evento NODE_UPDATED -> COMPLETED
                    await publish_execution_event_async(
                        str(execution_id),
                        {
                            "event": "NODE_UPDATED",
                            "execution_id": str(execution_id),
                            "node_id": node_id,
                            "status": ExecutionStatus.COMPLETED.value,
                            "metrics": node_metrics,
                            "error_message": None,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                else:
                    failed_count += 1
                    node_exec.status = ExecutionStatus.FAILED
                    node_exec.finished_at = datetime.now(timezone.utc)
                    node_exec.error_message = last_error
                    await db.commit()

                    # Evento NODE_UPDATED -> FAILED
                    await publish_execution_event_async(
                        str(execution_id),
                        {
                            "event": "NODE_UPDATED",
                            "execution_id": str(execution_id),
                            "node_id": node_id,
                            "status": ExecutionStatus.FAILED.value,
                            "metrics": None,
                            "error_message": last_error,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )

                    # Abortar pipeline completo ante fallo inasumible del nodo
                    error_summary = f"Fallo catastrófico en el nodo '{node_id}': {last_error}"
                    execution.status = ExecutionStatus.FAILED
                    execution.error_summary = error_summary
                    execution.finished_at = datetime.now(timezone.utc)
                    await db.commit()

                    await publish_execution_event_async(
                        str(execution_id),
                        {
                            "event": "EXECUTION_FINISHED",
                            "execution_id": str(execution_id),
                            "node_id": node_id,
                            "status": ExecutionStatus.FAILED.value,
                            "metrics": {"processed_nodes": processed_count, "failed_nodes": failed_count},
                            "error_message": error_summary,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    return {"status": "FAILED", "error": error_summary}

            # 6. Finalizar pipeline exitosamente: RUNNING -> COMPLETED
            execution.status = ExecutionStatus.COMPLETED
            execution.finished_at = datetime.now(timezone.utc)
            await db.commit()

            await publish_execution_event_async(
                str(execution_id),
                {
                    "event": "EXECUTION_FINISHED",
                    "execution_id": str(execution_id),
                    "node_id": None,
                    "status": ExecutionStatus.COMPLETED.value,
                    "metrics": {
                        "total_nodes": len(sorted_nodes),
                        "processed_nodes": processed_count,
                        "failed_nodes": 0,
                    },
                    "error_message": None,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

            logger.info(f"Pipeline completado exitosamente: {execution_id}")
            return {"status": "COMPLETED", "nodes_processed": processed_count}

    def _topological_sort(
        self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Algoritmo de ordenamiento topológico (Kahn) para verificar validez del DAG
        y determinar el orden exacto de ejecución de los nodos.
        """
        if not nodes:
            return [], "El DAG está vacío y no contiene nodos para procesar."

        nodes_by_id = {node["id"]: node for node in nodes}
        in_degree = {node["id"]: 0 for node in nodes}
        graph = {node["id"]: [] for node in nodes}

        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in graph and tgt in in_degree:
                graph[src].append(tgt)
                in_degree[tgt] += 1

        queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
        sorted_nodes = []

        while queue:
            current_id = queue.popleft()
            sorted_nodes.append(nodes_by_id[current_id])

            for neighbor in graph.get(current_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(sorted_nodes) != len(nodes):
            return [], "El DAG contiene ciclos dirigidos inválidos. Se requiere un Grafo Acíclico Dirigido."

        return sorted_nodes, None

    async def _get_or_create_node_execution(
        self, db: AsyncSession, execution_id: UUID, node_id: str, node_type: str
    ) -> PipelineNodeExecutionModel:
        """
        Obtiene un registro de ejecución de nodo existente o crea uno nuevo en PostgreSQL.
        """
        stmt = select(PipelineNodeExecutionModel).where(
            PipelineNodeExecutionModel.execution_id == execution_id,
            PipelineNodeExecutionModel.node_id == node_id,
        )
        result = await db.execute(stmt)
        node_exec = result.scalar_one_or_none()

        if not node_exec:
            node_exec = PipelineNodeExecutionModel(
                execution_id=execution_id,
                node_id=node_id,
                node_type=node_type,
                status=ExecutionStatus.PENDING,
                attempt_count=0,
            )
            db.add(node_exec)
            await db.commit()
            await db.refresh(node_exec)

        return node_exec

    async def _execute_node_with_retries(
        self, db: AsyncSession, node_exec: PipelineNodeExecutionModel, node: Dict[str, Any]
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Ejecuta la tarea del nodo aplicando el algoritmo de Backoff Exponencial con Jitter:
        t_wait = 2^attempt + uniform(0, 1)
        """
        last_error = None
        for attempt in range(1, self.MAX_RETRIES + 1):
            node_exec.attempt_count = attempt
            await db.commit()

            if attempt > 1:
                # Algoritmo obligatorio de Backoff Exponencial con Jitter
                jitter = random.uniform(0.0, 1.0)
                wait_seconds = (2.0 ** attempt) + jitter
                logger.info(
                    f"Reintentando nodo '{node_exec.node_id}' (intento {attempt}/{self.MAX_RETRIES}) "
                    f"tras esperar {wait_seconds:.2f}s."
                )
                await asyncio.sleep(wait_seconds)

            try:
                metrics = await self._run_node_task_logic(node)
                return True, metrics, None
            except Exception as e:
                last_error = str(e)
                logger.warning(
                    f"Fallo en el intento {attempt} del nodo '{node_exec.node_id}': {last_error}"
                )

        return False, None, last_error

    async def _run_node_task_logic(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """
        Lógica simulada de procesamiento ETL para extractores, transformadores y cargadores.
        """
        node_data = node.get("data", {})
        config = node_data.get("config", {})
        node_type = node_data.get("type", "processor")

        # Simulación de latencia de red/I/O realista (0.3s a 0.8s)
        await asyncio.sleep(random.uniform(0.3, 0.8))

        # Soporte de test de fallos para resiliencia y verificación
        if (
            config.get("fail_test") is True
            or config.get("force_fail") is True
            or config.get("forceFail") is True
            or "fail" in str(config.get("transformFunction", "")).lower()
        ):
            raise ValueError(f"Fallo simulado por configuración de prueba en el nodo '{node.get('id')}'")

        records_count = config.get("batch_size", random.randint(100, 5000))
        exec_time = random.randint(45, 350)

        return {
            "node_id": node.get("id"),
            "node_type": node_type,
            "processed_records": records_count,
            "execution_time_ms": exec_time,
            "status": "SUCCESS",
        }


orchestrator = PipelineOrchestrator()


async def execute_pipeline_dag(execution_id: UUID) -> Dict[str, Any]:
    """
    Función de utilidad para ejecutar un DAG por su UUID.
    """
    return await orchestrator.execute_pipeline(execution_id)
