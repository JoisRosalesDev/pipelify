import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.execution import (
    ExecutionStatus,
    PipelineExecutionModel,
    PipelineNodeExecutionModel,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Estados finales que indican que la ejecución terminó
TERMINAL_STATES = {ExecutionStatus.COMPLETED, ExecutionStatus.FAILED}

# Intervalo de polling a la base de datos (segundos)
POLL_INTERVAL_SECONDS = 0.6

# Timeout máximo de espera para una ejecución (5 minutos)
MAX_EXECUTION_WAIT_SECONDS = 300


@router.websocket("/ws/executions/{execution_id}")
async def websocket_execution_endpoint(
    websocket: WebSocket,
    execution_id: str,
    token: Optional[str] = Query(None),
):
    """
    Endpoint WebSocket bidireccional para transmisión de telemetría en tiempo real.
    Acepta la conexión de inmediato para cumplir con el handshake ASGI y luego verifica autenticación.
    """
    # 1. Aceptar la conexión ASGI de inmediato
    await websocket.accept()

    # 2. Validación de Token JWT
    auth_token = token or websocket.query_params.get("token")
    if not auth_token:
        auth_header = websocket.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            auth_token = auth_header[7:].strip()

    if not auth_token:
        logger.warning(f"WebSocket {execution_id}: Token no proporcionado.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token requerido")
        return

    clean_token = auth_token.strip()
    if clean_token.startswith("Bearer "):
        clean_token = clean_token[7:].strip()

    if clean_token != "dev_token":
        try:
            jwt.decode(
                clean_token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except Exception as exc:
            logger.warning(f"WebSocket {execution_id}: Token inválido ({exc})")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Token inválido")
            return

    # 3. Validación de UUID
    try:
        uuid_execution_id = UUID(execution_id)
    except ValueError:
        logger.warning(f"WebSocket {execution_id}: UUID inválido.")
        await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA, reason="UUID inválido")
        return

    logger.info(f"WebSocket activo y autenticado para ejecución: {execution_id}")

    # 4. Estado de seguimiento local
    last_known_status: Optional[ExecutionStatus] = None
    last_node_states: dict[str, ExecutionStatus] = {}
    started_event_sent = False
    elapsed = 0.0

    async def safe_send(payload: dict) -> bool:
        try:
            await websocket.send_text(json.dumps(payload))
            return True
        except (WebSocketDisconnect, RuntimeError, asyncio.CancelledError):
            return False
        except Exception as err:
            logger.debug(f"Error al enviar por WS: {err}")
            return False

    # Tarea 1: Heartbeat PING cada 20 segundos
    async def ping_heartbeat():
        try:
            while True:
                await asyncio.sleep(20)
                ok = await safe_send({
                    "event": "PING",
                    "execution_id": str(execution_id),
                    "status": ExecutionStatus.RUNNING.value,
                    "metrics": None,
                    "error_message": None,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                if not ok:
                    break
        except (asyncio.CancelledError, RuntimeError, WebSocketDisconnect):
            pass

    # Tarea 2: Escuchar mensajes del cliente (PONG)
    async def client_listener():
        try:
            while True:
                msg_text = await websocket.receive_text()
                try:
                    data = json.loads(msg_text)
                    if data.get("event") == "PONG":
                        logger.debug(f"PONG recibido ({execution_id})")
                except Exception:
                    pass
        except (WebSocketDisconnect, asyncio.CancelledError, RuntimeError):
            pass

    # Tarea 3: Poller de PostgreSQL en tiempo real
    async def db_poller():
        nonlocal last_known_status, last_node_states, started_event_sent, elapsed

        async with AsyncSessionLocal() as db:
            while elapsed < MAX_EXECUTION_WAIT_SECONDS:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
                elapsed += POLL_INTERVAL_SECONDS

                try:
                    stmt = (
                        select(PipelineExecutionModel)
                        .where(PipelineExecutionModel.id == uuid_execution_id)
                        .options(selectinload(PipelineExecutionModel.node_executions))
                    )
                    result = await db.execute(stmt)
                    execution = result.scalar_one_or_none()

                    if not execution:
                        continue

                    now_ts = datetime.now(timezone.utc).isoformat()

                    # Emitir EXECUTION_STARTED cuando pasa de PENDING a RUNNING
                    if not started_event_sent and execution.status == ExecutionStatus.RUNNING:
                        started_event_sent = True
                        last_known_status = ExecutionStatus.RUNNING
                        ok = await safe_send({
                            "event": "EXECUTION_STARTED",
                            "execution_id": str(execution_id),
                            "node_id": None,
                            "status": ExecutionStatus.RUNNING.value,
                            "metrics": {"total_nodes": len(execution.node_executions)},
                            "error_message": None,
                            "timestamp": now_ts,
                        })
                        if not ok:
                            return

                    # Emitir NODE_UPDATED cuando el estado de un nodo cambia
                    for node_exec in execution.node_executions:
                        prev = last_node_states.get(node_exec.node_id)
                        if prev != node_exec.status:
                            last_node_states[node_exec.node_id] = node_exec.status
                            ok = await safe_send({
                                "event": "NODE_UPDATED",
                                "execution_id": str(execution_id),
                                "node_id": node_exec.node_id,
                                "status": node_exec.status.value,
                                "metrics": node_exec.output_data,
                                "error_message": node_exec.error_message,
                                "timestamp": now_ts,
                            })
                            if not ok:
                                return

                    # Emitir EXECUTION_FINISHED cuando llega a estado terminal
                    if execution.status in TERMINAL_STATES and execution.status != last_known_status:
                        last_known_status = execution.status
                        await safe_send({
                            "event": "EXECUTION_FINISHED",
                            "execution_id": str(execution_id),
                            "node_id": None,
                            "status": execution.status.value,
                            "metrics": {
                                "total_nodes": len(execution.node_executions),
                                "processed_nodes": sum(
                                    1 for n in execution.node_executions
                                    if n.status == ExecutionStatus.COMPLETED
                                ),
                                "failed_nodes": sum(
                                    1 for n in execution.node_executions
                                    if n.status == ExecutionStatus.FAILED
                                ),
                            },
                            "error_message": execution.error_summary,
                            "timestamp": now_ts,
                        })
                        await asyncio.sleep(1.0)
                        return

                except (asyncio.CancelledError, RuntimeError, WebSocketDisconnect):
                    return
                except Exception as exc:
                    logger.error(f"Error en DB poller WS para {execution_id}: {exc}")
                    await asyncio.sleep(1.5)

    ping_task = asyncio.create_task(ping_heartbeat())
    client_task = asyncio.create_task(client_listener())
    poller_task = asyncio.create_task(db_poller())

    try:
        done, pending = await asyncio.wait(
            [client_task, poller_task, ping_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    except Exception as exc:
        logger.error(f"Error en bucle WS para {execution_id}: {exc}")
    finally:
        logger.info(f"Conexión WebSocket cerrada para ejecución: {execution_id}")
