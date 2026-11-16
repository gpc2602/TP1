from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

try:
    from app.models import NivelRiesgo
except Exception:
    import enum

    class NivelRiesgo(str, enum.Enum):
        bajo = "Bajo"
        medio = "Medio"
        alto = "Alto"
        critico = "Critico"

logger = logging.getLogger(__name__)

# Rutas de los artefactos del modelo
BASE_DIR = Path(__file__).resolve().parent.parent
ML_MODELS_DIR = BASE_DIR / "ml_models"

MODEL_PATH = ML_MODELS_DIR / "modelo_prediccion_delitos_lima_enriquecido.joblib"
COLUMNS_PATH = ML_MODELS_DIR / "columnas_modelo.joblib"
PERFIL_PATH = ML_MODELS_DIR / "perfil_riesgo_mensual.json"
CATALOGOS_PATH = ML_MODELS_DIR / "catalogos_frontend.json"

# Coordenadas geográficas oficiales de distritos de Lima Metropolitana
COORDENADAS_LIMA: dict[str, tuple[float, float]] = {
    "ANCON": (-11.7742, -77.1758),
    "ATE": (-12.0267, -76.9189),
    "BARRANCO": (-12.1492, -77.0211),
    "BREÑA": (-12.0603, -77.0436),
    "CARABAYLLO": (-11.8500, -77.0333),
    "CHACLACAYO": (-11.9750, -76.7692),
    "CHORRILLOS": (-12.1625, -77.0219),
    "CIENEGUILLA": (-12.1000, -76.8000),
    "COMAS": (-11.9333, -77.0500),
    "EL AGUSTINO": (-12.0453, -77.0044),
    "INDEPENDENCIA": (-11.9833, -77.0500),
    "JESUS MARIA": (-12.0747, -77.0481),
    "LA MOLINA": (-12.0792, -76.9261),
    "LA VICTORIA": (-12.0653, -77.0153),
    "LIMA": (-12.0464, -77.0428),
    "LINCE": (-12.0833, -77.0333),
    "LOS OLIVOS": (-11.9667, -77.0667),
    "LURIGANCHO": (-11.9333, -76.7000),
    "LURIN": (-12.2833, -76.8667),
    "MAGDALENA DEL MAR": (-12.0911, -77.0683),
    "MIRAFLORES": (-12.1211, -77.0297),
    "PACHACAMAC": (-12.1333, -76.8667),
    "PUCUSANA": (-12.4333, -76.8000),
    "PUEBLO LIBRE": (-12.0769, -77.0631),
    "PUENTE PIEDRA": (-11.8667, -77.0833),
    "PUNTA HERMOSA": (-12.3333, -76.8333),
    "PUNTA NEGRA": (-12.3667, -76.8000),
    "RIMAC": (-12.0333, -77.0333),
    "SAN BARTOLO": (-12.3833, -76.7833),
    "SAN BORJA": (-12.1083, -77.0056),
    "SAN ISIDRO": (-12.0975, -77.0353),
    "SAN JUAN DE LURIGANCHO": (-11.9833, -77.0000),
    "SAN JUAN DE MIRAFLORES": (-12.1500, -76.9667),
    "SAN LUIS": (-12.0750, -76.9917),
    "SAN MARTIN DE PORRES": (-12.0000, -77.0833),
    "SAN MIGUEL": (-12.0778, -77.0944),
    "SANTA ANITA": (-12.0444, -76.9694),
    "SANTA MARIA DEL MAR": (-12.4000, -76.7667),
    "SANTA ROSA": (-11.8000, -77.1667),
    "SANTIAGO DE SURCO": (-12.1333, -76.9833),
    "SURQUILLO": (-12.1131, -77.0197),
    "VILLA EL SALVADOR": (-12.2167, -76.9333),
    "VILLA MARIA DEL TRIUNFO": (-12.1667, -76.9333),
}

# Estado global en memoria (singleton)
_modelo: Any | None = None
_columnas: list[str] | None = None
_perfil_riesgo: dict[str, Any] = {}
_catalogos: dict[str, Any] = {}
_modelo_version: str = "RandomForest-Lima-v1.0"


@dataclass(slots=True)
class PrediccionResultado:
    probabilidad: float
    nivel_riesgo: NivelRiesgo
    modelo_version: str


# ---------------------------------------------------------------------------
# Carga del modelo y artefactos
# ---------------------------------------------------------------------------
def cargar_modelo() -> None:
    """Carga el modelo Random Forest y artefactos en memoria al arrancar la API."""
    global _modelo, _columnas, _perfil_riesgo, _catalogos, _modelo_version

    if not MODEL_PATH.exists() or not COLUMNS_PATH.exists():
        logger.warning(
            "Artefactos ML no encontrados en %s. Se usará el modo heurístico de respaldo.",
            ML_MODELS_DIR,
        )
        _modelo = None
        _modelo_version = "heuristico"
        return

    try:
        _modelo = joblib.load(MODEL_PATH)
        _columnas = joblib.load(COLUMNS_PATH)

        if PERFIL_PATH.exists():
            with open(PERFIL_PATH, "r", encoding="utf-8") as f:
                _perfil_riesgo = json.load(f)

        if CATALOGOS_PATH.exists():
            with open(CATALOGOS_PATH, "r", encoding="utf-8") as f:
                _catalogos = json.load(f)

        _modelo_version = "RandomForest-Lima-v1.0"
        logger.info("✅ Modelo de predicción de delitos Lima cargado con éxito desde %s", ML_MODELS_DIR)
    except Exception:
        logger.exception("Error al cargar modelo en %s. Se usará fallback heurístico.", ML_MODELS_DIR)
        _modelo = None
        _modelo_version = "heuristico"


def modelo_cargado() -> bool:
    return _modelo is not None


# ---------------------------------------------------------------------------
# Utilidades internas
# ---------------------------------------------------------------------------
def estimar_nivel_riesgo(denuncias: float) -> NivelRiesgo:
    if denuncias >= 150:
        return NivelRiesgo.critico
    elif denuncias >= 80:
        return NivelRiesgo.alto
    elif denuncias >= 35:
        return NivelRiesgo.medio
    return NivelRiesgo.bajo


def _distrito_mas_cercano(lat: float, lon: float) -> str:
    """Encuentra el distrito de Lima Metropolitana más cercano a unas coordenadas."""
    distrito_cercano = "LIMA"
    min_dist_sq = float("inf")

    for dist, (d_lat, d_lon) in COORDENADAS_LIMA.items():
        dist_sq = (lat - d_lat) ** 2 + (lon - d_lon) ** 2
        if dist_sq < min_dist_sq:
            min_dist_sq = dist_sq
            distrito_cercano = dist

    return distrito_cercano


# ---------------------------------------------------------------------------
# API pública del servicio de predicción
# ---------------------------------------------------------------------------
def predecir_delitos(
    anio: int = 2026,
    mes: int = 12,
    distrito: str = "MIRAFLORES",
    modalidad: str = "ROBO",
) -> dict[str, Any]:
    """Predice la cantidad estimada de delitos para un distrito, mes y modalidad."""
    dist_upper = distrito.strip().upper()
    mod_upper = modalidad.strip().upper()
    coords = COORDENADAS_LIMA.get(dist_upper, (-12.0464, -77.0428))

    if _modelo is None or _columnas is None:
        # Fallback heurístico en caso no se encuentren los .joblib
        denuncias_base = 25
        if dist_upper in ["SAN JUAN DE LURIGANCHO", "LIMA", "COMAS", "SAN MARTIN DE PORRES", "ATE"]:
            denuncias_base = 120
        return {
            "id": f"cell-{dist_upper}",
            "distrito": dist_upper,
            "modalidad": mod_upper,
            "anio": anio,
            "mes": mes,
            "denuncias_estimadas": denuncias_base,
            "nivel_riesgo": estimar_nivel_riesgo(denuncias_base).value,
            "probabilidad": min(1.0, round(denuncias_base / 250.0, 4)),
            "modelo_version": _modelo_version,
            "coordenadas": {"lat": coords[0], "lng": coords[1]},
            "factores": [
                {"name": "Iluminación deficiente", "value": 0.32},
                {"name": "Brecha videovigilancia", "value": 0.28},
                {"name": "Estacionalidad temporal", "value": 0.20},
            ],
        }

    # 1. Crear fila de entrada con las columnas de entrenamiento
    X_input = pd.DataFrame(0, index=[0], columns=_columnas)

    # 2. Asignar variables numéricas y cíclicas
    X_input["anio_den"] = int(anio)
    X_input["mes_den"] = int(mes)
    X_input["mes_sin"] = np.sin(2 * np.pi * mes / 12)
    X_input["mes_cos"] = np.cos(2 * np.pi * mes / 12)

    # 3. Variables complementarias de riesgo desde el perfil precargado
    info_mes = _perfil_riesgo.get(
        str(mes), _perfil_riesgo.get(int(mes), _perfil_riesgo.get("default", {}))
    )
    if "iluminacion_deficiente_pct" in X_input.columns:
        X_input["iluminacion_deficiente_pct"] = float(info_mes.get("iluminacion_deficiente_pct", 25.0))
    if "cobertura_videovigilancia_pct" in X_input.columns:
        X_input["cobertura_videovigilancia_pct"] = float(info_mes.get("cobertura_videovigilancia_pct", 50.0))

    # 4. Asignar coordenadas del distrito
    X_input["latitud"] = coords[0]
    X_input["longitud"] = coords[1]

    # 5. One-Hot Encoding explícito (drop_first=False)
    col_dist = f"dist_hecho_{dist_upper}"
    col_mod = f"p_modalidades_{mod_upper}"
    if col_dist in X_input.columns:
        X_input[col_dist] = 1
    if col_mod in X_input.columns:
        X_input[col_mod] = 1

    # 6. Inferencia del modelo Random Forest
    pred_raw = float(_modelo.predict(X_input)[0])
    denuncias = max(0, int(round(pred_raw)))
    nivel = estimar_nivel_riesgo(denuncias)

    # Factores relativos para visualización
    ilum_val = float(info_mes.get("iluminacion_deficiente_pct", 25.0)) / 100.0
    cam_val = (100.0 - float(info_mes.get("cobertura_videovigilancia_pct", 50.0))) / 100.0
    estac_val = round(abs(float(np.sin(2 * np.pi * mes / 12))), 2)

    return {
        "id": f"cell-{dist_upper}",
        "distrito": dist_upper,
        "modalidad": mod_upper,
        "anio": anio,
        "mes": mes,
        "denuncias_estimadas": denuncias,
        "nivel_riesgo": nivel.value,
        "probabilidad": min(1.0, round(denuncias / 250.0, 4)),
        "modelo_version": _modelo_version,
        "coordenadas": {"lat": coords[0], "lng": coords[1]},
        "factores": [
            {"name": "Iluminación deficiente", "value": round(ilum_val, 2)},
            {"name": "Brecha videovigilancia", "value": round(cam_val, 2)},
            {"name": "Estacionalidad temporal", "value": estac_val},
        ],
    }


def obtener_mapa_calor_delitos(
    anio: int = 2026,
    mes: int = 12,
    modalidad: str = "ROBO",
) -> dict[str, Any]:
    """Genera la predicción masiva de los 43 distritos de Lima Metropolitana para el mapa."""
    zonas: list[dict[str, Any]] = []
    total_denuncias = 0
    zonas_criticas = 0
    zonas_altas = 0

    # Iterar sobre todos los distritos del catálogo
    distritos_orden = sorted(COORDENADAS_LIMA.keys())

    for distrito in distritos_orden:
        res = predecir_delitos(anio, mes, distrito, modalidad)
        den = res["denuncias_estimadas"]
        total_denuncias += den

        nivel = res["nivel_riesgo"]
        if nivel == NivelRiesgo.critico.value:
            zonas_criticas += 1
        elif nivel == NivelRiesgo.alto.value:
            zonas_altas += 1

        zonas.append(res)

    # Ordenar por mayor cantidad de denuncias
    zonas.sort(key=lambda z: z["denuncias_estimadas"], reverse=True)

    return {
        "anio": anio,
        "mes": mes,
        "modalidad": modalidad.upper(),
        "total_zonas": len(zonas),
        "total_denuncias": total_denuncias,
        "zonas_criticas": zonas_criticas,
        "zonas_altas": zonas_altas,
        "distrito_mayor_incidencia": zonas[0]["distrito"] if zonas else "",
        "zonas": zonas,
    }


def obtener_catalogos() -> dict[str, Any]:
    """Devuelve los catálogos válidos de distritos, modalidades y coordenadas."""
    distritos = sorted(COORDENADAS_LIMA.keys())
    modalidades = [
        "ROBO",
        "HURTO",
        "ESTAFA",
        "EXTORSIÓN",
        "VIOLENCIA CONTRA LA MUJER E INTEGRANTES",
        "SECUESTRO",
        "OTROS",
    ]
    anios = [2024, 2025, 2026, 2027]

    return {
        "distritos": distritos,
        "modalidades": modalidades,
        "anios": anios,
        "coordenadas": COORDENADAS_LIMA,
    }


def predecir_riesgo(
    lat: float,
    lon: float,
    hora: int | None = None,
    clima: str = "despejado",
    iluminacion: str = "media",
    dia_semana: int | None = None,
) -> PrediccionResultado:
    """Función de compatibilidad con endpoints geoespaciales previos.

    Mapea coordenadas al distrito más cercano y estima el nivel de riesgo.
    """
    distrito = _distrito_mas_cercano(lat, lon)
    ahora = datetime.now()
    res = predecir_delitos(
        anio=ahora.year,
        mes=ahora.month,
        distrito=distrito,
        modalidad="ROBO",
    )

    prob = res["probabilidad"]
    nivel = estimar_nivel_riesgo(res["denuncias_estimadas"])

    return PrediccionResultado(
        probabilidad=prob,
        nivel_riesgo=nivel,
        modelo_version=_modelo_version,
    )
