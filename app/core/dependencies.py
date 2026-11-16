from collections.abc import Callable, Coroutine
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.user_repository import UserRepository
from app.models import RolUsuario, Usuario

bearer_scheme = HTTPBearer(auto_error=False)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No se pudieron validar las credenciales",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: Annotated[Any, Depends(get_db)],
) -> Usuario:
    """Obtiene el usuario autenticado y su rol a partir del token Bearer JWT."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación ausente",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as exc:
        raise _CREDENTIALS_EXCEPTION from exc

    user_id = payload.get("sub")
    if user_id is None:
        raise _CREDENTIALS_EXCEPTION

    try:
        user_id_int = int(user_id)
    except (TypeError, ValueError) as exc:
        raise _CREDENTIALS_EXCEPTION from exc

    user_data = UserRepository.get_by_id(user_id_int, db=db)
    if not user_data:
        raise _CREDENTIALS_EXCEPTION

    if not user_data.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta de usuario se encuentra inactiva",
        )

    rol_str = user_data.get("rol", "operador")
    try:
        rol_val = RolUsuario(rol_str)
    except Exception:
        rol_val = RolUsuario.operador

    return Usuario(
        id=user_data["id"],
        nombre=user_data["nombre"],
        email=user_data["email"],
        rol=rol_val,
        activo=user_data.get("activo", True),
    )


CurrentUser = Annotated[Usuario, Depends(get_current_user)]


def verificar_rol(
    roles_permitidos: list[RolUsuario | str],
) -> Callable[[Usuario], Coroutine[Any, Any, Usuario]]:
    """Fabrica una dependencia que exige uno de los roles indicados."""
    permitidos = {RolUsuario(r) if isinstance(r, str) else r for r in roles_permitidos}

    async def _check(current_user: CurrentUser) -> Usuario:
        user_rol = current_user.rol
        if isinstance(user_rol, str):
            try:
                user_rol = RolUsuario(user_rol)
            except Exception:
                pass

        if user_rol not in permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "No tiene permisos suficientes para este módulo. "
                    f"Roles autorizados: {sorted(r.value if hasattr(r, 'value') else str(r) for r in permitidos)}"
                ),
            )
        return current_user

    return _check
