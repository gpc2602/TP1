from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracion central de la aplicacion (variables de entorno)."""

    model_config = SettingsConfigDict(
        env_file=(".env.backend", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Aplicacion ---
    PROJECT_NAME: str = "PredictiSafe API"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # --- Base de datos (driver asincrono asyncpg) ---
    # Formato esperado:
    #   postgresql+asyncpg://usuario:password@host:5432/predictisafe
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/predictisafe",
        description="URL de conexion asincrona a PostgreSQL/PostGIS.",
        examples=["postgresql+asyncpg://postgres:postgres@localhost:5432/predictisafe"],
    )
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_PRE_PING: bool = True

    # --- Seguridad / JWT ---
    SECRET_KEY: str = Field(
        default="predictisafe-dev-secret-key-super-secure-2026-ml",
        description="Clave secreta para firmar los JWT. Usar un valor largo y aleatorio.",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


@lru_cache
def get_settings() -> Settings:
    """Devuelve una instancia cacheada de Settings."""
    return Settings()


settings = get_settings()
