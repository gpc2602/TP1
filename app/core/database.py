from collections.abc import AsyncGenerator
from typing import Any

from app.core.config import settings

engine: Any = None
AsyncSessionLocal: Any = None

try:
    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )

    # Motor asincrono de SQLAlchemy (usa asyncpg como driver).
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DB_ECHO,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=settings.DB_POOL_PRE_PING,
        future=True,
    )

    # Fabrica de sesiones asincronas reutilizable.
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
except Exception:
    # Si SQLAlchemy no esta instalado localmente, no bloquea el servidor ML
    engine = None
    AsyncSessionLocal = None


async def get_db() -> AsyncGenerator[Any, None]:
    """Dependencia de FastAPI: entrega una sesion por request si la BD esta disponible."""
    if AsyncSessionLocal is None:
        yield None
        return

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
