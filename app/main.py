from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.database import engine
from app.models import Base
from app.routes import auth, predict, system
from app.services.prediction import cargar_modelo

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Carga el modelo de Machine Learning en memoria
    cargar_modelo()
    # Si la base de datos está disponible con SQLAlchemy completo
    if engine is not None and getattr(Base, "metadata", None) is not None:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e:
            logger.warning("Base de datos externa no conectada (%s). Servidor ML funcionando normalmente.", e)
    yield
    if engine is not None:
        try:
            await engine.dispose()
        except Exception:
            pass


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Configuración de CORS para permitir la conexión desde el frontend en React (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(system.router)


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Sistema"])
async def health() -> dict[str, str]:
    return {"status": "ok"}



@app.get("/health", tags=["Sistema"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
