import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select

from app.core.redis import publish_execution_event_async
from app.db.session import AsyncSessionLocal
from app.models.execution import ExecutionStatus, PipelineExecutionModel
from app.services.orchestrator import execute_pipeline_dag
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _mark_execution_failed_async(execution_id_str: str, error_msg: str) -> None:
    """
    Actualiza el estado de la ejecución en PostgreSQL a FAILED y notifica vía Redis Pub/Sub
    cuando el worker de Celery agota sus reintentos o falla críticamente.
    """
    try:
        execution_id = UUID(execution_id_str)
        async with AsyncSessionLocal() as db:
            stmt = select(PipelineExecutionModel).where(PipelineExecutionModel.id == execution_id)
            result = await db.execute(stmt)
            execution = result.scalar_one_or_none()
            if execution:
                execution.status = ExecutionStatus.FAILED
                execution.error_summary = f"Fallo en worker Celery: {error_msg}"
                execution.finished_at = datetime.now(timezone.utc)
                await db.commit()

            await publish_execution_event_async(
                execution_id_str,
                {
                    "event": "EXECUTION_FINISHED",
                    "execution_id": execution_id_str,
                    "node_id": None,
                    "status": ExecutionStatus.FAILED.value,
                    "metrics": None,
                    "error_message": f"Fallo en worker Celery: {error_msg}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
    except Exception as exc:
        logger.error(f"Error al marcar la ejecución como FAILED en DB ({execution_id_str}): {exc}")


@celery_app.task(bind=True, name="app.workers.tasks.execute_pipeline_task", max_retries=3)
def execute_pipeline_task(self, execution_id_str: str) -> dict:
    """
    Tarea principal de Celery enviada al broker Upstash Redis tras el POST /api/v1/executions.
    Ejecuta el ciclo de vida del orquestador asíncrono en el contexto del worker.
    En caso de falla permanente o reintentos agotados, actualiza el estado en PostgreSQL a FAILED.
    """
    logger.info(f"Procesando tarea de fondo Celery para execution_id: {execution_id_str}")
    try:
        execution_id = UUID(execution_id_str)
        result = asyncio.run(execute_pipeline_dag(execution_id))
        logger.info(f"Tarea Celery finalizada con éxito para {execution_id_str}: {result}")
        return result
    except Exception as exc:
        logger.error(f"Error crítico en worker Celery procesando ejecución {execution_id_str}: {exc}")
        if self.request.retries >= self.max_retries:
            logger.error(
                f"Reintentos de Celery agotados ({self.max_retries}) para {execution_id_str}. Marcando estado FAILED."
            )
            asyncio.run(_mark_execution_failed_async(execution_id_str, str(exc)))
            return {"status": "FAILED", "error": str(exc)}
        raise self.retry(exc=exc, countdown=5)
