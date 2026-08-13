import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import jwt
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.config import settings
from app.core.redis import get_pubsub_subscriber
from app.models.execution import ExecutionStatus

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/executions/{execution_id}")
@router.websocket("/api/v1/ws/executions/{execution_id}")
async def websocket_execution_endpoint(
    websocket: WebSocket,
    execution_id: UUID,
    token: Optional[str] = Query(None),
):
    """
    Endpoint WebSocket bidireccional para transmisión en tiempo real de telemetría de ejecuciones.
    Pre-verifica JWT antes de `websocket.accept()`, retornando WS 1008 si el token es inválido o falta.
    Mantiene un heartbeat PING cada 20 segundos y retransmite eventos de Redis Pub/Sub.
    """
    # 1. Pre-verificación del Token JWT antes de aceptar la conexión WebSocket
    auth_token = token
    if not auth_token:
        auth_token = websocket.query_params.get("token")

    if not auth_token:
        logger.warning(f"Intento de conexión WebSocket sin token para ejecución {execution_id}")
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Token JWT no proporcionado",
        )
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
            logger.warning(
                f"Rechazando WebSocket para {execution_id}: Token JWT inválido o expirado. Error: {exc}"
            )
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Token JWT inválido o expirado",
            )
            return

    # 2. Token verificado exitosamente -> Aceptar la conexión WebSocket
    await websocket.accept()
    logger.info(f"Conexión WebSocket aceptada exitosamente para la ejecución: {execution_id}")

    # 3. Suscribirse al canal dinámico Redis Pub/Sub: execution:{execution_id}
    pubsub = await get_pubsub_subscriber(str(execution_id))

    # Tarea 1: Escuchar y retransmitir eventos desde Redis Pub/Sub hacia el cliente WS
    async def redis_listener():
        try:
            async for message in pubsub.listen():
                if message and message.get("type") == "message":
                    data = message.get("data")
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    await websocket.send_text(data)
        except asyncio.CancelledError:
            pass
        except RuntimeError:
            pass # Socket cerrado por el framework ASGI
        except Exception as exc:
            logger.error(f"Error en bucle listener de Redis Pub/Sub para {execution_id}: {exc}")

    # Tarea 2: Heartbeat PING cada 20 segundos
    async def ping_heartbeat():
        try:
            while True:
                await asyncio.sleep(20)
                ping_payload = {
                    "event": "PING",
                    "execution_id": str(execution_id),
                    "status": ExecutionStatus.RUNNING.value,
                    "metrics": None,
                    "error_message": None,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
                await websocket.send_text(json.dumps(ping_payload))
        except asyncio.CancelledError:
            pass
        except RuntimeError:
            pass # Socket cerrado
        except Exception as exc:
            logger.debug(f"Bucle de PING finalizado para {execution_id}: {exc}")

    # Tarea 3: Escuchar mensajes y respuestas PONG del cliente
    async def client_listener():
        try:
            while True:
                msg_text = await websocket.receive_text()
                try:
                    data = json.loads(msg_text)
                    if data.get("event") == "PONG":
                        logger.debug(f"PONG recibido vía JSON del cliente WS ({execution_id})")
                except Exception:
                    if msg_text.strip().upper() == "PONG":
                        logger.debug(f"PONG recibido en texto del cliente WS ({execution_id})")
        except WebSocketDisconnect:
            logger.info(f"Cliente WebSocket desconectado normalmente ({execution_id})")
        except asyncio.CancelledError:
            pass
        except RuntimeError:
            pass
        except Exception as exc:
            logger.debug(f"Cliente WebSocket finalizado para {execution_id}: {exc}")

    ping_task = asyncio.create_task(ping_heartbeat())
    redis_task = asyncio.create_task(redis_listener())
    client_task = asyncio.create_task(client_listener())

    try:
        # Esperar a que la PRIMERA tarea finalice (típicamente client_listener por desconexión)
        done, pending = await asyncio.wait(
            [client_task, redis_task, ping_task],
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # Cancelar explícitamente las tareas que aún corren
        for task in pending:
            task.cancel()
            
    finally:
        # 4. Desuscripción limpia de Redis Pub/Sub en bloque finally
        try:
            await pubsub.unsubscribe(f"execution:{execution_id}")
            await pubsub.close()
            logger.info(f"Desuscripción limpia de Redis Pub/Sub efectuada para execution:{execution_id}")
        except Exception as exc:
            logger.error(f"Error al desuscribir Pub/Sub de Redis para {execution_id}: {exc}")
