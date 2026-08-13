import json
from functools import lru_cache
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración global de la aplicación Pipelify cargada desde variables de entorno.
    Carga de forma estricta y tipada las 10 variables principales del sistema.
    """
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    NEXT_PUBLIC_WS_URL: str = "ws://localhost:8000"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pipelify"
    DIRECT_URL: str = "postgresql://postgres:postgres@localhost:5432/pipelify"
    UPSTASH_REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "super-secret-jwt-key-pipelify-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "https://pipelify.vercel.app",
    ]
    CELERY_CONCURRENCY: int = 4
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip().rstrip("/") for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return [origin.strip().rstrip("/") for origin in v]
        return v

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_async_db_url(cls, v: str) -> str:
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
