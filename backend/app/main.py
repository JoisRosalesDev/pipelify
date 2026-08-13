import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.redis import close_redis_client
from app.db.session import engine

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("pipelify")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestor de ciclo de vida para la aplicación FastAPI.
    Controla el inicio y cierre seguro de conexiones de base de datos y Redis.
    """
    logger.info("Iniciando servicio Pipelify Core Backend...")
    yield
    logger.info("Cerrando conexiones de base de datos y clientes de Redis...")
    await close_redis_client()
    await engine.dispose()
    logger.info("Servicio Pipelify Core Backend finalizado correctamente.")


from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Pipelify Realtime Pipeline Orchestration API",
    description="Motor de Orquestación y Monitoreo de Pipelines ETL en Tiempo Real",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuración de Middleware CORS con orígenes dinámicos autorizados
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Excepción no capturada en {request.url}: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Error interno del servidor: {str(exc)}"},
    )
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

from app.api.v1.endpoints import websockets

app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router)
app.include_router(websockets.router)



@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    """
    Endpoint de comprobación de salud del servicio backend.
    """
    return {
        "status": "ok",
        "service": "pipelify-backend",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
