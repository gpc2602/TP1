# =============================================================================
# Dockerfile - PredictiSafe API (FastAPI + SQLAlchemy async + PostGIS)
# Imagen base liviana de Python 3.10.
# =============================================================================
FROM python:3.10-slim

# Buenas practicas de Python en contenedores.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Dependencias del sistema necesarias para compilar paquetes nativos
# (cabeceras de PostgreSQL, toolchain C y librerias geoespaciales GEOS/PROJ).
# La mayoria de wheels ya vienen precompiladas; esto cubre builds desde fuente.
# Si se usaran rasterio/fiona/GDAL, agregar: libgdal-dev gdal-bin.
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libpq-dev \
        libgeos-dev \
        libproj-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Capa de dependencias (se cachea si requirements.txt no cambia).
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# Codigo fuente del backend (incluye seed.py y el modelo .pkl si esta presente).
COPY . .

# Usuario no privilegiado para ejecutar la API.
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Healthcheck basado en el endpoint /health de la API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# Arranque con Uvicorn.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
