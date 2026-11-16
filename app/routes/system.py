from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.audit_repository import AuditRepository
from app.core.dependencies import CurrentUser, verificar_rol
from app.core.user_repository import UserRepository
from app.models import Usuario

router = APIRouter(prefix="/api", tags=["Sistema, Auditoria y Configuracion"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
COMISARIAS_FILE = DATA_DIR / "comisarias_zonas.json"
ALERTS_FILE = DATA_DIR / "alerts_db.json"

DEFAULT_ALERTS = [
    {
        "id": "A-001",
        "type": "robbery",
        "title": "Robo agravado a transeúnte",
        "district": "San Martín de Porres",
        "location": "Av. Perú con Jr. Quilca",
        "severity": "critical",
        "status": "active",
        "time": "Hace 4 min",
        "description": "Dos sujetos a bordo de motocicleta lineal despojaron de pertenencias a ciudadana con arma de fuego. Fuga con dirección al este.",
        "assignedPatrol": "SMP-01",
        "lat": -12.0315,
        "lng": -77.0682,
        "created_at": "2026-11-03T22:40:00Z",
    },
    {
        "id": "A-002",
        "type": "assault",
        "title": "Intento de asalto a local comercial",
        "district": "Cercado de Lima",
        "location": "Jr. De la Unión con Av. Emancipación",
        "severity": "high",
        "status": "active",
        "time": "Hace 12 min",
        "description": "Sujeto sospechoso intentó forzar reja perimétrica de farmacia. Intervención visual confirmada por cámaras de vigilancia.",
        "assignedPatrol": None,
        "lat": -12.0475,
        "lng": -77.0345,
        "created_at": "2026-11-03T22:32:00Z",
    },
    {
        "id": "A-003",
        "type": "vehicle",
        "title": "Sustracción de accesorios vehiculares",
        "district": "La Victoria",
        "location": "Av. Iquitos cuadra 12",
        "severity": "medium",
        "status": "responding",
        "time": "Hace 22 min",
        "description": "Fractura de luna lateral de vehículo estacionado. Unidad Victoria-02 en ruta de aproximación.",
        "assignedPatrol": "VIC-02",
        "lat": -12.0678,
        "lng": -77.0268,
        "created_at": "2026-11-03T22:22:00Z",
    },
    {
        "id": "A-004",
        "type": "suspicious",
        "title": "Presencia de personas sospechosas",
        "district": "Breña",
        "location": "Jr. Huaraz con Jr. Loreto",
        "severity": "low",
        "status": "resolved",
        "time": "Hace 45 min",
        "description": "Tres individuos merodeando viviendas particulares. Patrulla Breña-01 efectuó control de identidad sin novedades.",
        "assignedPatrol": "BRE-01",
        "lat": -12.0612,
        "lng": -77.0450,
        "created_at": "2026-11-03T21:59:00Z",
    },
    {
        "id": "A-005",
        "type": "emergency",
        "title": "Alteración del orden público",
        "district": "Miraflores",
        "location": "Parque Kennedy frente a Calle de las Pizzas",
        "severity": "medium",
        "status": "resolved",
        "time": "Hace 1h 10m",
        "description": "Gresca entre transeúntes controlada oportunamente por efectivos de Serenazgo y PNP asignados al sector.",
        "assignedPatrol": "MIRA-03",
        "lat": -12.1215,
        "lng": -77.0305,
        "created_at": "2026-11-03T21:34:00Z",
    },
]


def _ensure_alerts() -> list[dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not ALERTS_FILE.exists():
        with open(ALERTS_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_ALERTS, f, indent=2, ensure_ascii=False)
        return list(DEFAULT_ALERTS)
    try:
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return list(DEFAULT_ALERTS)


def _save_alerts(alerts: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(ALERTS_FILE, "w", encoding="utf-8") as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)


def _get_comisarias_zonas() -> dict[str, Any]:
    if not COMISARIAS_FILE.exists():
        return {"comisarias": [], "zonas": []}
    try:
        with open(COMISARIAS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"comisarias": [], "zonas": []}


def _save_comisarias_zonas(data: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(COMISARIAS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Estado del Sistema
# ---------------------------------------------------------------------------
@router.get("/system/status", summary="Métricas de salud y rendimiento de la plataforma")
def get_system_status() -> dict[str, Any]:
    users = UserRepository.list_users()
    alerts = _ensure_alerts()
    active_alerts = len([a for a in alerts if a.get("status") == "active"])
    responding_alerts = len([a for a in alerts if a.get("status") == "responding"])
    resolved_alerts = len([a for a in alerts if a.get("status") == "resolved"])

    return {
        "status": "operativo",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": "99.8%",
        "uptime_days": 30,
        "services": {
            "api": {"status": "ok", "latency_ms": 115, "version": "v2.4"},
            "predictive_engine": {
                "status": "ok",
                "model_name": "Random Forest / XGBoost Enriquecido",
                "accuracy": "87.4%",
                "features_count": 52,
                "districts_covered": 43,
                "cell_resolution": "500m²",
                "last_run": "Hace 5 min",
            },
            "database": {"status": "ok", "type": "JSON/PostGIS Dual Store", "active_records": len(users)},
            "alerts_system": {
                "status": "ok",
                "active": active_alerts,
                "responding": responding_alerts,
                "resolved": resolved_alerts,
                "total_today": len(alerts),
            },
        },
        "stats": {
            "total_users": len(users),
            "total_alerts": len(alerts),
            "districts": 43,
        },
    }


# ---------------------------------------------------------------------------
# Logs de Auditoría
# ---------------------------------------------------------------------------
@router.get("/audit/logs", summary="Lista de logs de auditoría y trazabilidad")
def get_audit_logs(
    action_type: str | None = Query(None),
    user_name: str | None = Query(None),
    status_filter: str | None = Query(None),
) -> list[dict[str, Any]]:
    return AuditRepository.list_logs(
        action_type=action_type,
        user_name=user_name,
        status_filter=status_filter,
    )


# ---------------------------------------------------------------------------
# Comisarías y Zonas
# ---------------------------------------------------------------------------
@router.get("/config/comisarias", summary="Directorio de comisarías PNP de Lima")
def get_comisarias() -> list[dict[str, Any]]:
    data = _get_comisarias_zonas()
    return data.get("comisarias", [])


@router.post("/config/comisarias", status_code=status.HTTP_201_CREATED, summary="Registra una nueva comisaría")
def add_comisaria(payload: dict[str, Any]) -> dict[str, Any]:
    data = _get_comisarias_zonas()
    comisarias = data.get("comisarias", [])
    new_id = max((c["id"] for c in comisarias), default=0) + 1
    new_c = {
        "id": new_id,
        "nombre": payload.get("nombre", f"Comisaría {new_id}"),
        "distrito": payload.get("distrito", "Lima"),
        "direccion": payload.get("direccion", "Dirección no especificada"),
        "telefono": payload.get("telefono", "(01) 105"),
        "comisario": payload.get("comisario", "Oficial PNP a cargo"),
        "patrullas_asignadas": int(payload.get("patrullas_asignadas", 4)),
        "efectivos": int(payload.get("efectivos", 30)),
        "estado": payload.get("estado", "Operativa"),
        "coordenadas": payload.get("coordenadas", [-12.05, -77.04]),
    }
    comisarias.append(new_c)
    data["comisarias"] = comisarias
    _save_comisarias_zonas(data)
    AuditRepository.add_log(
        user="Administrador",
        user_email="admin@serenazgo.gob.pe",
        action="Nueva comisaría registrada",
        action_type="config",
        details=f"Registro de {new_c['nombre']} en {new_c['distrito']}.",
    )
    return new_c


@router.get("/config/zonas", summary="Sectores y cuadrantes operacionales de serenazgo")
def get_zonas() -> list[dict[str, Any]]:
    data = _get_comisarias_zonas()
    return data.get("zonas", [])


@router.post("/config/zonas", status_code=status.HTTP_201_CREATED, summary="Registra una nueva zona operativa")
def add_zona(payload: dict[str, Any]) -> dict[str, Any]:
    data = _get_comisarias_zonas()
    zonas = data.get("zonas", [])
    new_id = max((z["id"] for z in zonas), default=0) + 1
    new_z = {
        "id": new_id,
        "codigo": payload.get("codigo", f"SEC-{new_id:02d}"),
        "nombre": payload.get("nombre", f"Sector {new_id:02d}"),
        "distrito": payload.get("distrito", "Lima"),
        "nivel_riesgo": payload.get("nivel_riesgo", "Medio"),
        "color_riesgo": "#F59E0B" if payload.get("nivel_riesgo") == "Medio" else "#DC2626",
        "supervisor_cargo": payload.get("supervisor_cargo", "Supervisor de Guardia"),
        "patrullas_activas": int(payload.get("patrullas_activas", 3)),
        "poblacion_estimada": payload.get("poblacion_estimada", "50,000 hab."),
        "cobertura": payload.get("cobertura", "80%"),
        "delitos_frecuentes": payload.get("delitos_frecuentes", ["Robo al paso"]),
    }
    zonas.append(new_z)
    data["zonas"] = zonas
    _save_comisarias_zonas(data)
    AuditRepository.add_log(
        user="Administrador",
        user_email="admin@serenazgo.gob.pe",
        action="Nueva zona operativa creada",
        action_type="config",
        details=f"Creación del {new_z['nombre']} ({new_z['codigo']}) en {new_z['distrito']}.",
    )
    return new_z


# ---------------------------------------------------------------------------
# Alertas
# ---------------------------------------------------------------------------
@router.get("/alerts", summary="Lista de alertas en tiempo real")
def get_alerts() -> list[dict[str, Any]]:
    return _ensure_alerts()


@router.post("/alerts", status_code=status.HTTP_201_CREATED, summary="Emite una nueva alerta temprana")
def create_alert(payload: dict[str, Any]) -> dict[str, Any]:
    alerts = _ensure_alerts()
    new_num = len(alerts) + 1
    new_alert = {
        "id": f"A-{new_num:03d}",
        "type": payload.get("type", "robbery"),
        "title": payload.get("title", "Alerta de seguridad ciudadana"),
        "district": payload.get("district", "San Martín de Porres"),
        "location": payload.get("location", "Intersección vial"),
        "severity": payload.get("severity", "high"),
        "status": "active",
        "time": "Hace 1 min",
        "description": payload.get("description", "Incidente reportado por central de radio."),
        "assignedPatrol": payload.get("assignedPatrol"),
        "lat": float(payload.get("lat", -12.04)),
        "lng": float(payload.get("lng", -77.05)),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    alerts.insert(0, new_alert)
    _save_alerts(alerts)
    AuditRepository.add_log(
        user="Central de Monitoreo",
        user_email="alertas@serenazgo.gob.pe",
        action=f"Alerta {new_alert['id']} emitida",
        action_type="alert",
        details=f"Emisión de alerta {new_alert['severity'].upper()} en {new_alert['district']} ({new_alert['location']}).",
    )
    return new_alert


@router.patch("/alerts/{alert_id}/dispatch", summary="Despacha una unidad de patrulla a la alerta")
def dispatch_alert(alert_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    alerts = _ensure_alerts()
    unit = payload.get("unit", "SMP-01")
    for a in alerts:
        if a["id"] == alert_id:
            a["status"] = "responding"
            a["assignedPatrol"] = unit
            _save_alerts(alerts)
            AuditRepository.add_log(
                user="Supervisor de Despacho",
                user_email="supervisor@serenazgo.gob.pe",
                action=f"Patrulla {unit} despachada",
                action_type="alert",
                details=f"Despacho a incidente {alert_id} en {a.get('location', 'sector')}.",
            )
            return a
    raise HTTPException(status_code=404, detail="Alerta no encontrada")


@router.patch("/alerts/{alert_id}/resolve", summary="Marca la alerta como resuelta")
def resolve_alert(alert_id: str) -> dict[str, Any]:
    alerts = _ensure_alerts()
    for a in alerts:
        if a["id"] == alert_id:
            a["status"] = "resolved"
            _save_alerts(alerts)
            AuditRepository.add_log(
                user="Operador Central",
                user_email="operador@serenazgo.gob.pe",
                action=f"Alerta {alert_id} resuelta",
                action_type="alert",
                details=f"Incidente verificado y concluido en {a.get('district', '')}.",
            )
            return a
    raise HTTPException(status_code=404, detail="Alerta no encontrada")
