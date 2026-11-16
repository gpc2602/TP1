from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
AUDIT_FILE = DATA_DIR / "audit_logs.json"

DEFAULT_INITIAL_LOGS = [
    {
        "id": 1,
        "timestamp": "2026-11-03T21:45:10Z",
        "user": "Com. César Morales",
        "user_email": "admin@serenazgo.gob.pe",
        "action": "Inicio de sesión institucional",
        "action_type": "login",
        "ip": "192.168.1.10",
        "details": "Autenticación exitosa con credenciales institucionales y token JWT emitido.",
        "status": "success",
    },
    {
        "id": 2,
        "timestamp": "2026-11-03T21:30:45Z",
        "user": "Sup. Patricia Vega",
        "user_email": "supervisor@serenazgo.gob.pe",
        "action": "Despacho de patrulla SMP-01",
        "action_type": "alert",
        "ip": "192.168.1.25",
        "details": "Despacho táctico de unidad a zona crítica en Av. Perú con Jr. Quilca.",
        "status": "success",
    },
    {
        "id": 3,
        "timestamp": "2026-11-03T21:15:20Z",
        "user": "Analista Gabriela Torres",
        "user_email": "analista@serenazgo.gob.pe",
        "action": "Ejecución de inferencia predictiva",
        "action_type": "model",
        "ip": "192.168.1.42",
        "details": "Cálculo de mapa de calor geoespacial de riesgo delictivo para Lima Metropolitana.",
        "status": "success",
    },
    {
        "id": 4,
        "timestamp": "2026-11-03T20:50:00Z",
        "user": "Sistema Automático",
        "user_email": "sistema@predictisafe.gob.pe",
        "action": "Calibración de modelo Random Forest / XGBoost",
        "action_type": "model",
        "ip": "127.0.0.1",
        "details": "Carga de 43 distritos y 52 variables del catálogo en memoria.",
        "status": "success",
    },
    {
        "id": 5,
        "timestamp": "2026-11-03T20:10:15Z",
        "user": "Com. César Morales",
        "user_email": "admin@serenazgo.gob.pe",
        "action": "Actualización de umbral crítico",
        "action_type": "config",
        "ip": "192.168.1.10",
        "details": "Ajuste de umbral de riesgo crítico: 70% -> 75% para activación de alertas.",
        "status": "warning",
    },
    {
        "id": 6,
        "timestamp": "2026-11-03T19:40:00Z",
        "user": "Operador Manuel Quispe",
        "user_email": "operador@serenazgo.gob.pe",
        "action": "Confirmación de alerta en Breña",
        "action_type": "alert",
        "ip": "192.168.2.14",
        "details": "Incidente reportado atendido y verificado en Jr. Huaraz.",
        "status": "success",
    },
    {
        "id": 7,
        "timestamp": "2026-11-03T18:30:00Z",
        "user": "Analista Gabriela Torres",
        "user_email": "analista@serenazgo.gob.pe",
        "action": "Exportación de reporte estadístico",
        "action_type": "export",
        "ip": "192.168.1.42",
        "details": "Generación de reporte analítico mensual en formato Excel/CSV.",
        "status": "success",
    },
]


class AuditRepository:
    """Repositorio de logs de auditoría para trazabilidad del sistema."""

    @staticmethod
    def _ensure_store() -> list[dict[str, Any]]:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not AUDIT_FILE.exists():
            with open(AUDIT_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_INITIAL_LOGS, f, indent=2, ensure_ascii=False)
            return list(DEFAULT_INITIAL_LOGS)

        try:
            with open(AUDIT_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return list(DEFAULT_INITIAL_LOGS)

    @staticmethod
    def _save_store(logs: list[dict[str, Any]]) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(AUDIT_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)

    @classmethod
    def list_logs(
        cls,
        action_type: str | None = None,
        user_name: str | None = None,
        status_filter: str | None = None,
    ) -> list[dict[str, Any]]:
        logs = cls._ensure_store()
        filtered = logs
        if action_type and action_type != "all":
            filtered = [l for l in filtered if l.get("action_type") == action_type]
        if user_name and user_name != "Todos":
            filtered = [l for l in filtered if user_name.lower() in l.get("user", "").lower()]
        if status_filter and status_filter != "all":
            filtered = [l for l in filtered if l.get("status") == status_filter]
        return filtered

    @classmethod
    def add_log(
        cls,
        user: str,
        user_email: str,
        action: str,
        action_type: str,
        details: str,
        status: str = "success",
        ip: str = "127.0.0.1",
    ) -> dict[str, Any]:
        logs = cls._ensure_store()
        new_id = max((l["id"] for l in logs), default=0) + 1
        new_entry = {
            "id": new_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user": user,
            "user_email": user_email,
            "action": action,
            "action_type": action_type,
            "ip": ip,
            "details": details,
            "status": status,
        }
        logs.insert(0, new_entry)
        # Limitar historial a los últimos 500 eventos
        if len(logs) > 500:
            logs = logs[:500]
        cls._save_store(logs)
        return new_entry
