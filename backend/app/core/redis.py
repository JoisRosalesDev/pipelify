import json
import logging
from typing import Any, Dict, Optional

import redis as sync_redis
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Instancia global cliente Redis asíncrono
_async_redis_client: Optional[aioredis.Redis] = None


def get_redis_client() -> aioredis.Redis:
    """
    Retorna o crea la instancia Singleton del cliente Redis Asíncrono (aioredis).
    Conecta utilizando la variable de entorno UPSTASH_REDIS_URL.
    """
    global _async_redis_client
    if _async_redis_client is None:
        _async_redis_client = aioredis.from_url(
            settings.UPSTASH_REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            health_check_interval=30,
        )
    return _async_redis_client


async def close_redis_client() -> None:
    """
    Cierra de forma limpia la conexión del cliente Redis Asíncrono durante el apagado de la app.
    """
    global _async_redis_client
    if _async_redis_client is not None:
        await _async_redis_client.close()
        _async_redis_client = None
        logger.info("Conexión cliente Async Redis cerrada exitosamente.")


def get_sync_redis_client() -> sync_redis.Redis:
    """
    Retorna un cliente Redis Síncrono para workers de Celery o contextos síncronos.
    """
    return sync_redis.Redis.from_url(
        settings.UPSTASH_REDIS_URL,
        decode_responses=True,
        health_check_interval=30,
    )


async def get_pubsub_subscriber(execution_id: str) -> aioredis.client.PubSub:
    """
    Factoría de suscriptores Pub/Sub para el canal dinámico execution:{execution_id}.
    Retorna una instancia de PubSub lista para transmitir eventos por WebSockets.
    """
    client = get_redis_client()
    pubsub = client.pubsub()
    channel_name = f"execution:{execution_id}"
    await pubsub.subscribe(channel_name)
    logger.info(f"Suscripto dinámicamente al canal Redis Pub/Sub: '{channel_name}'")
    return pubsub


async def publish_execution_event_async(execution_id: str, payload: Dict[str, Any]) -> None:
    """
    Publica un evento asíncronamente en el canal Redis Pub/Sub execution:{execution_id}.
    """
    client = get_redis_client()
    channel_name = f"execution:{execution_id}"
    message = json.dumps(payload)
    await client.publish(channel_name, message)
    logger.debug(f"Evento publicado en Redis [{channel_name}]: {payload.get('event')}")


def publish_execution_event_sync(execution_id: str, payload: Dict[str, Any]) -> None:
    """
    Publica un evento de forma síncrona en el canal Redis Pub/Sub execution:{execution_id}.
    Útil para tareas enviadas desde los workers de Celery.
    """
    client = get_sync_redis_client()
    try:
        channel_name = f"execution:{execution_id}"
        message = json.dumps(payload)
        client.publish(channel_name, message)
        logger.debug(f"Evento síncrono publicado en Redis [{channel_name}]: {payload.get('event')}")
    finally:
        client.close()
