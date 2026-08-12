from celery import Celery
from app.core.config import settings

# Instancia principal de la aplicación Celery
celery_app = Celery(
    "pipelify_workers",
    broker=settings.UPSTASH_REDIS_URL,
    backend=settings.UPSTASH_REDIS_URL,
    include=["app.workers.tasks"]
)

# Configuración de rendimiento, serialización y concurrencia
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    worker_concurrency=settings.CELERY_CONCURRENCY,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

if __name__ == "__main__":
    celery_app.start()
