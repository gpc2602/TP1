from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from app.core.security import hash_password, verify_password
from app.models import RolUsuario, Usuario

# Archivo de persistencia local cuando no hay PostgreSQL externo configurado
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
USERS_FILE = DATA_DIR / "users_db.json"

DEFAULT_INITIAL_USERS = [
    {
        "id": 1,
        "nombre": "Com. César Morales",
        "email": "admin@serenazgo.gob.pe",
        "password": "Admin2026!",
        "rol": RolUsuario.administrador.value,
        "distrito": "Lima Centro",
        "activo": True,
        "creado_en": "2026-01-15T08:00:00Z",
        "ultimo_acceso": "2026-11-03T21:30:00Z",
    },
    {
        "id": 2,
        "nombre": "Sup. Patricia Vega",
        "email": "supervisor@serenazgo.gob.pe",
        "password": "Supervisor2026!",
        "rol": RolUsuario.supervisor.value,
        "distrito": "Miraflores",
        "activo": True,
        "creado_en": "2026-02-01T09:15:00Z",
        "ultimo_acceso": "2026-11-03T21:12:00Z",
    },
    {
        "id": 3,
        "nombre": "Analista Gabriela Torres",
        "email": "analista@serenazgo.gob.pe",
        "password": "Analista2026!",
        "rol": RolUsuario.analista.value,
        "distrito": "San Isidro",
        "activo": True,
        "creado_en": "2026-02-10T11:00:00Z",
        "ultimo_acceso": "2026-11-03T20:45:00Z",
    },
    {
        "id": 4,
        "nombre": "Operador Manuel Quispe",
        "email": "operador@serenazgo.gob.pe",
        "password": "Operador2026!",
        "rol": RolUsuario.operador.value,
        "distrito": "Breña",
        "activo": True,
        "creado_en": "2026-03-05T07:30:00Z",
        "ultimo_acceso": "2026-11-03T19:20:00Z",
    },
]


class UserRepository:
    """Repositorio de usuarios con persistencia segura y respuesta síncrona/asíncrona garantizada."""

    @staticmethod
    def _ensure_local_store() -> list[dict[str, Any]]:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not USERS_FILE.exists():
            users = []
            for u in DEFAULT_INITIAL_USERS:
                item = dict(u)
                plain_pw = item.pop("password")
                item["password_hash"] = hash_password(plain_pw)
                users.append(item)
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(users, f, indent=2, ensure_ascii=False)
            return users

        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @staticmethod
    def _save_local_store(users: list[dict[str, Any]]) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2, ensure_ascii=False)

    @classmethod
    def get_by_email(cls, email: str, db: Any = None) -> dict[str, Any] | None:
        email_clean = email.strip().lower()

        # Persistencia local segura
        users = cls._ensure_local_store()
        for u in users:
            if u["email"].lower() == email_clean:
                return u
        return None

    @classmethod
    def get_by_id(cls, user_id: int, db: Any = None) -> dict[str, Any] | None:
        users = cls._ensure_local_store()
        for u in users:
            if u["id"] == user_id:
                return u
        return None

    @classmethod
    def list_users(cls, db: Any = None) -> list[dict[str, Any]]:
        users = cls._ensure_local_store()
        clean_list = []
        for u in users:
            item = dict(u)
            item.pop("password_hash", None)
            clean_list.append(item)
        return clean_list

    @classmethod
    def create_user(
        cls,
        nombre: str,
        email: str,
        password: str,
        rol: str,
        distrito: str = "Lima Centro",
        db: Any = None,
    ) -> dict[str, Any]:
        email_clean = email.strip().lower()
        users = cls._ensure_local_store()
        for u in users:
            if u["email"].lower() == email_clean:
                raise ValueError("El correo electrónico ya se encuentra registrado")

        new_id = max((u["id"] for u in users), default=0) + 1
        pw_hash = hash_password(password)
        now_iso = datetime.now(timezone.utc).isoformat()

        new_user = {
            "id": new_id,
            "nombre": nombre.strip(),
            "email": email_clean,
            "password_hash": pw_hash,
            "rol": rol,
            "distrito": distrito,
            "activo": True,
            "creado_en": now_iso,
            "ultimo_acceso": None,
        }
        users.append(new_user)
        cls._save_local_store(users)

        result = dict(new_user)
        result.pop("password_hash", None)
        return result

    @classmethod
    def toggle_status(cls, user_id: int, db: Any = None) -> dict[str, Any] | None:
        users = cls._ensure_local_store()
        for u in users:
            if u["id"] == user_id:
                u["activo"] = not u.get("activo", True)
                cls._save_local_store(users)
                res = dict(u)
                res.pop("password_hash", None)
                return res
        return None

    @classmethod
    def update_user(
        cls,
        user_id: int,
        nombre: str | None = None,
        email: str | None = None,
        rol: str | None = None,
        distrito: str | None = None,
        password: str | None = None,
        db: Any = None,
    ) -> dict[str, Any] | None:
        """Actualiza los datos personales, distrito y rol de un usuario existente."""
        users = cls._ensure_local_store()
        target_user = None
        for u in users:
            if u["id"] == user_id:
                target_user = u
                break

        if not target_user:
            return None

        if email:
            clean_email = email.strip().lower()
            for other in users:
                if other["id"] != user_id and other["email"].lower() == clean_email:
                    raise ValueError("El correo electrónico ya está registrado por otro funcionario")
            target_user["email"] = clean_email

        if nombre:
            target_user["nombre"] = nombre.strip()

        if rol:
            target_user["rol"] = rol.strip().lower()

        if distrito is not None:
            target_user["distrito"] = distrito.strip()

        if password and len(password.strip()) >= 6:
            target_user["password_hash"] = hash_password(password.strip())

        cls._save_local_store(users)
        res = dict(target_user)
        res.pop("password_hash", None)
        return res

    @classmethod
    def delete_user(cls, user_id: int, db: Any = None) -> bool:
        """Elimina permanentemente un usuario del repositorio local."""
        users = cls._ensure_local_store()
        initial_len = len(users)
        users = [u for u in users if u["id"] != user_id]
        if len(users) < initial_len:
            cls._save_local_store(users)
            return True
        return False

    @classmethod
    def record_login(cls, user_id: int, db: Any = None) -> None:
        users = cls._ensure_local_store()
        now_iso = datetime.now(timezone.utc).isoformat()
        for u in users:
            if u["id"] == user_id:
                u["ultimo_acceso"] = now_iso
                cls._save_local_store(users)
                break
