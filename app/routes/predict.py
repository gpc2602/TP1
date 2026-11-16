from __future__ import annotations

import json
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

try:
    from geoalchemy2.elements import WKTElement
    from sqlalchemy import func, select
except Exception:
    WKTElement = None
    func = None
    select = None

from app.core.database import get_db
from app.core.dependencies import CurrentUser
from app.core.geo import cuadrado_wkt, punto_wkt
from app.models import Alerta, CuadriculaRiesgo, NivelRiesgo, NivelSeveridad
from app.services.prediction import (
    obtener_catalogos,
    obtener_mapa_calor_delitos,
    predecir_delitos,
    predecir_riesgo,
)

router = APIRouter(prefix="/api", tags=["Prediccion"])


# ---------------------------------------------------------------------------
# Esquemas
# ---------------------------------------------------------------------------
class DelitoPredictRequest(BaseModel):
    anio: int = Field(default=2026, ge=2018, le=2035, examples=[2026])
    mes: int = Field(default=12, ge=1, le=12, examples=[12])
    distrito: str = Field(default="MIRAFLORES", examples=["MIRAFLORES"])
    modalidad: str = Field(default="ROBO", examples=["ROBO"])


class PredictRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, examples=[-12.0464])
    lon: float = Field(..., ge=-180, le=180, examples=[-77.0428])
    hora: int | None = Field(default=None, ge=0, le=23)
    dia_semana: int | None = Field(default=None, ge=0, le=6)
    clima: str = Field(default="despejado")
    iluminacion: str = Field(default="media")
    tamano_metros: float = Field(default=500.0, gt=0, le=5000)


class PredictResponse(BaseModel):
    cuadricula_id: int
    probabilidad: float
    nivel_riesgo: NivelRiesgo
    alerta_id: int | None = None
    modelo_version: str
    geometria: dict[str, Any]


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict[str, Any]
    properties: dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
async def _geojson_poligono(db: Any, cuadricula_id: int) -> dict[str, Any]:
    if db is None or select is None or func is None:
        return {"type": "Polygon", "coordinates": []}
    stmt = select(
        func.ST_AsGeoJSON(CuadriculaRiesgo.poligono)
    ).where(CuadriculaRiesgo.id == cuadricula_id)
    raw = (await db.execute(stmt)).scalar_one()
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get(
    "/predict/catalogos",
    summary="Devuelve el catálogo de distritos, modalidades y coordenadas para el frontend",
)
def catalogos_endpoint() -> dict[str, Any]:
    return obtener_catalogos()


@router.get(
    "/predict/mapa-calor",
    summary="Devuelve la predicción masiva de los 43 distritos de Lima Metropolitana para el mapa",
)
def mapa_calor_predictivo_endpoint(
    anio: int = Query(2026, ge=2018, le=2035),
    mes: int = Query(12, ge=1, le=12),
    modalidad: str = Query("ROBO"),
) -> dict[str, Any]:
    """Genera en milisegundos las denuncias y niveles de riesgo de toda Lima Metropolitana."""
    return obtener_mapa_calor_delitos(
        anio,
        mes,
        modalidad,
    )


@router.post(
    "/predict/delitos",
    summary="Predice la cantidad estimada de denuncias para un distrito y contexto",
)
def predecir_delito_endpoint(payload: DelitoPredictRequest) -> dict[str, Any]:
    """Predice delitos estimados para un distrito, año, mes y modalidad."""
    return predecir_delitos(
        payload.anio,
        payload.mes,
        payload.distrito,
        payload.modalidad,
    )


@router.post(
    "/predict",
    response_model=PredictResponse,
    status_code=201,
    summary="Predice el riesgo, lo persiste y alerta si es critico",
)
async def predecir(
    payload: PredictRequest,
    db: Annotated[Any, Depends(get_db)],
    current_user: CurrentUser,
) -> PredictResponse:
    """Ejecuta el modelo, guarda la cuadricula y crea alerta si es critico."""
    # XGBoost es CPU-bound: se ejecuta fuera del event loop.
    resultado = await run_in_threadpool(
        predecir_riesgo,
        payload.lat,
        payload.lon,
        payload.hora,
        payload.clima,
        payload.iluminacion,
        payload.dia_semana,
    )

    wkt_cuadricula = cuadrado_wkt(payload.lat, payload.lon, payload.tamano_metros)
    cuadricula = CuadriculaRiesgo(
        poligono=WKTElement(wkt_cuadricula, srid=4326),
        nivel_riesgo=resultado.nivel_riesgo,
        probabilidad_predicha=Decimal(str(resultado.probabilidad)),
        modelo_version=resultado.modelo_version,
    )
    db.add(cuadricula)
    await db.flush()

    alerta_id: int | None = None
    if resultado.nivel_riesgo == NivelRiesgo.critico:
        alerta = Alerta(
            coordenada=WKTElement(punto_wkt(payload.lat, payload.lon), srid=4326),
            descripcion=(
                f"Riesgo critico ({resultado.probabilidad:.2f}) detectado en "
                f"({payload.lat:.5f}, {payload.lon:.5f})."
            ),
            severidad=NivelSeveridad.critica,
            cuadricula_id=cuadricula.id,
            emitida_por=current_user.id,
        )
        db.add(alerta)
        await db.flush()
        alerta_id = alerta.id

    await db.commit()

    return PredictResponse(
        cuadricula_id=cuadricula.id,
        probabilidad=resultado.probabilidad,
        nivel_riesgo=resultado.nivel_riesgo,
        alerta_id=alerta_id,
        modelo_version=resultado.modelo_version,
        geometria=await _geojson_poligono(db, cuadricula.id),
    )


@router.get(
    "/heatmap",
    response_model=GeoJSONFeatureCollection,
    summary="Devuelve las cuadriculas de riesgo como GeoJSON",
)
async def heatmap(
    db: Annotated[Any, Depends(get_db)],
    _user: CurrentUser,
    nivel: Annotated[NivelRiesgo | None, Query()] = None,
    limite: Annotated[int, Query(ge=1, le=5000)] = 1000,
) -> GeoJSONFeatureCollection:
    """FeatureCollection lista para consumir en Leaflet sin transformaciones."""
    if db is None or select is None or func is None:
        return GeoJSONFeatureCollection(features=[])
    stmt = select(
        CuadriculaRiesgo.id,
        CuadriculaRiesgo.nivel_riesgo,
        CuadriculaRiesgo.probabilidad_predicha,
        CuadriculaRiesgo.modelo_version,
        CuadriculaRiesgo.calculado_en,
        func.ST_AsGeoJSON(CuadriculaRiesgo.poligono).label("geojson"),
    ).order_by(CuadriculaRiesgo.calculado_en.desc())

    if nivel is not None:
        stmt = stmt.where(CuadriculaRiesgo.nivel_riesgo == nivel)

    stmt = stmt.limit(limite)
    rows = (await db.execute(stmt)).all()

    features = [
        GeoJSONFeature(
            geometry=json.loads(row.geojson),
            properties={
                "id": row.id,
                "nivel_riesgo": row.nivel_riesgo.value,
                "probabilidad": float(row.probabilidad_predicha),
                "modelo_version": row.modelo_version,
                "calculado_en": row.calculado_en.isoformat(),
            },
        )
        for row in rows
    ]

    return GeoJSONFeatureCollection(features=features)
