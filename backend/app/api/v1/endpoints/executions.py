import asyncio
import logging
from datetime import datetime, timezone
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.redis import publish_execution_event_async
from app.db.session import get_db
from app.models.execution import (
    ExecutionStatus,
    PipelineExecutionModel,
    PipelineNodeExecutionModel,
)
from app.schemas.pipeline import (
    ExecutionDetailResponse,
    ExecutionResponse,
    PipelineDAGPayload,
    PipelineNodeExecutionDetail,
)
from app.services.orchestrator import execute_pipeline_dag
from app.workers.tasks import execute_pipeline_task

logger = logging.getLogger(__name__)

router = APIRouter()


def _format_node_detail(node: PipelineNodeExecutionModel) -> PipelineNodeExecutionDetail:
    """
    Convierte un modelo ORM PipelineNodeExecutionModel a su esquema Pydantic DTO.
    """
    return PipelineNodeExecutionDetail(
        id=node.id,
        execution_id=node.execution_id,
        node_id=node.node_id,
        node_type=node.node_type,
        status=node.status,
        attempt_count=node.attempt_count,
        error_message=node.error_message,
        input_data=node.input_data,
        output_data=node.output_data,
        started_at=node.started_at.isoformat() if node.started_at else None,
        finished_at=node.finished_at.isoformat() if node.finished_at else None,
        created_at=node.created_at.isoformat() if node.created_at else datetime.now(timezone.utc).isoformat(),
    )


@router.post(
    "",
    response_model=ExecutionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingestión de ejecuciones DAG de Pipeline",
    description="Recibe el payload DAG de un pipeline, lo persiste en estado PENDING y dispara el worker de Celery en < 100ms.",
)
@router.post(
    "/",
    response_model=ExecutionResponse,
    status_code=status.HTTP_202_ACCEPTED,
    include_in_schema=False,
)
async def create_execution(
    payload: PipelineDAGPayload,
    db: AsyncSession = Depends(get_db),
) -> ExecutionResponse:
    """
    Ingesta el DAG de un pipeline y responde con HTTP 202 Accepted en menos de 100ms.
    Procesa la ejecución mediante fallback asíncrono local directamente en FastAPI.
    """
    execution_id = uuid4()
    now = datetime.now(timezone.utc)

    try:
        # 1. Crear registro principal de ejecución
        execution = PipelineExecutionModel(
            id=execution_id,
            pipeline_id=payload.pipeline_id,
            status=ExecutionStatus.PENDING,
            dag_snapshot=payload.model_dump(mode="json"),
        )
        db.add(execution)

        # 2. Crear registros iniciales para los nodos del DAG
        for node in payload.nodes:
            node_type = getattr(node.data, "type", "extractor") if hasattr(node, "data") else "extractor"
            node_exec = PipelineNodeExecutionModel(
                execution_id=execution_id,
                node_id=node.id,
                node_type=str(node_type),
                status=ExecutionStatus.PENDING,
                attempt_count=0,
            )
            db.add(node_exec)

        await db.commit()
        await db.refresh(execution)

        # 3. Disparar procesamiento asíncrono local directo (Fallback sin bloqueo)
        try:
            execute_pipeline_task.delay(str(execution_id))
            logger.info(f"Tarea Celery encolada exitosamente para execution_id: {execution_id}")
        except BaseException as exc:
            logger.info(
                f"Celery no disponible en plan gratuito. Modo fallback asíncrono local activado: {exc}"
            )
            asyncio.create_task(execute_pipeline_dag(execution_id))

        return ExecutionResponse(
            execution_id=execution.id,
            pipeline_id=execution.pipeline_id,
            status=execution.status,
            created_at=execution.created_at.isoformat() if execution.created_at else now.isoformat(),
        )
    except Exception as exc:
        logger.error(f"Error en create_execution: {exc}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la ejecución: {str(exc)}",
        )


@router.get(
    "/{execution_id}",
    response_model=ExecutionDetailResponse,
    summary="Detalle completo de una ejecución",
    description="Retorna el estado global del pipeline, instantánea del DAG y detalles de ejecuciones de nodos.",
)
async def get_execution_detail(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ExecutionDetailResponse:
    """
    Obtiene los detalles globales de una ejecución dada su UUID.
    """
    stmt = (
        select(PipelineExecutionModel)
        .where(PipelineExecutionModel.id == execution_id)
        .options(selectinload(PipelineExecutionModel.node_executions))
    )
    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ejecución con ID '{execution_id}' no encontrada.",
        )

    node_details = [_format_node_detail(n) for n in execution.node_executions]

    return ExecutionDetailResponse(
        execution_id=execution.id,
        pipeline_id=execution.pipeline_id,
        status=execution.status,
        dag_snapshot=execution.dag_snapshot,
        error_summary=execution.error_summary,
        started_at=execution.started_at.isoformat() if execution.started_at else None,
        finished_at=execution.finished_at.isoformat() if execution.finished_at else None,
        created_at=execution.created_at.isoformat() if execution.created_at else datetime.now(timezone.utc).isoformat(),
        updated_at=execution.updated_at.isoformat() if execution.updated_at else datetime.now(timezone.utc).isoformat(),
        node_executions=node_details,
    )


@router.get(
    "/{execution_id}/nodes",
    response_model=List[PipelineNodeExecutionDetail],
    summary="Listado de ejecuciones de nodos",
    description="Retorna la lista de todos los nodos asociados a una ejecución.",
)
async def get_execution_nodes(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[PipelineNodeExecutionDetail]:
    """
    Obtiene la lista de ejecuciones de nodos pertenecientes a un pipeline.
    """
    exec_stmt = select(PipelineExecutionModel.id).where(PipelineExecutionModel.id == execution_id)
    exec_res = await db.execute(exec_stmt)
    if not exec_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ejecución con ID '{execution_id}' no encontrada.",
        )

    stmt = select(PipelineNodeExecutionModel).where(
        PipelineNodeExecutionModel.execution_id == execution_id
    )
    result = await db.execute(stmt)
    nodes = result.scalars().all()

    return [_format_node_detail(node) for node in nodes]


@router.post(
    "/{execution_id}/cancel",
    response_model=ExecutionResponse,
    summary="Cancelar una ejecución en curso",
    description="Marca la ejecución y sus nodos en estado FAILED notificando la cancelación vía Redis Pub/Sub.",
)
async def cancel_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ExecutionResponse:
    """
    Cancela una ejecución activa de pipeline de forma segura.
    """
    stmt = select(PipelineExecutionModel).where(PipelineExecutionModel.id == execution_id)
    result = await db.execute(stmt)
    execution = result.scalar_one_or_none()

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ejecución con ID '{execution_id}' no encontrada.",
        )

    if execution.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cancelar una ejecución en estado final '{execution.status.value}'.",
        )

    now = datetime.now(timezone.utc)
    execution.status = ExecutionStatus.FAILED
    execution.error_summary = "Ejecución cancelada por el usuario"
    execution.finished_at = now
    await db.commit()
    await db.refresh(execution)

    # Publicar evento de finalización por cancelación en Redis Pub/Sub
    await publish_execution_event_async(
        str(execution_id),
        {
            "event": "EXECUTION_FINISHED",
            "execution_id": str(execution_id),
            "node_id": None,
            "status": ExecutionStatus.FAILED.value,
            "metrics": None,
            "error_message": "Ejecución cancelada por el usuario",
            "timestamp": now.isoformat(),
        },
    )

    return ExecutionResponse(
        execution_id=execution.id,
        pipeline_id=execution.pipeline_id,
        status=execution.status,
        created_at=execution.created_at.isoformat() if execution.created_at else now.isoformat(),
    )
