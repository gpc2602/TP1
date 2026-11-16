from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

try:
    from pydantic import EmailStr
    from pydantic.networks import import_email_validator
    import_email_validator()
except Exception:
    EmailStr = str

from app.core.database import get_db
from app.core.dependencies import CurrentUser, verificar_rol
from app.core.security import create_access_token, verify_password
from app.core.user_repository import UserRepository
from app.core.audit_repository import AuditRepository
from app.models import RolUsuario, Usuario

router = APIRouter(prefix="/api/auth", tags=["Autenticacion"])


# ---------------------------------------------------------------------------
# Esquemas de entrada / salida
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["admin@serenazgo.gob.pe"])
    password: str = Field(..., min_length=4, examples=["Admin2026!"])


class UsuarioActual(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: RolUsuario
    activo: bool = True
    distrito: str | None = "Lima Centro"

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    nombre: str
    user: UsuarioActual


class RegisterRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=72)
    rol: RolUsuario = RolUsuario.operador
    distrito: str = Field(default="Lima Centro", max_length=100)


class UserUpdateRequest(BaseModel):
    nombre: str | None = Field(None, min_length=2, max_length=150)
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=6, max_length=72)
    rol: RolUsuario | None = None
    distrito: str | None = Field(None, max_length=100)


# ---------------------------------------------------------------------------
# Endpoints de Autenticación
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Inicia sesión con credenciales institucionales y devuelve JWT",
)
def login(
    payload: LoginRequest,
    db: Annotated[Any, Depends(get_db)],
) -> TokenResponse:
    """Valida credenciales reales contra el repositorio de usuarios y emite token JWT."""
    user_data = UserRepository.get_by_email(payload.email, db=db)

    if user_data is None or not verify_password(payload.password, user_data.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos. Verifique sus credenciales institucionales.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_data.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta institucional de este usuario se encuentra inactiva.",
        )

    rol_raw = user_data.get("rol", "operador")
    try:
        rol_enum = RolUsuario(rol_raw)
    except Exception:
        rol_enum = RolUsuario.operador

    token = create_access_token(
        subject=str(user_data["id"]),
        rol=rol_enum.value,
        extra_claims={
            "email": user_data["email"],
            "nombre": user_data["nombre"],
            "distrito": user_data.get("distrito", "Lima Centro"),
        },
    )

    UserRepository.record_login(user_data["id"], db=db)

    usuario_obj = UsuarioActual(
        id=user_data["id"],
        nombre=user_data["nombre"],
        email=user_data["email"],
        rol=rol_enum,
        activo=user_data.get("activo", True),
        distrito=user_data.get("distrito", "Lima Centro"),
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        rol=rol_enum,
        nombre=user_data["nombre"],
        user=usuario_obj,
    )


@router.get(
    "/me",
    response_model=UsuarioActual,
    summary="Devuelve el usuario autenticado actual con su rol",
)
def read_me(current_user: CurrentUser) -> UsuarioActual:
    """Endpoint protegido que devuelve el perfil y rol del usuario firmado en el JWT."""
    return UsuarioActual(
        id=current_user.id,
        nombre=current_user.nombre,
        email=current_user.email,
        rol=current_user.rol,
        activo=getattr(current_user, "activo", True),
        distrito=getattr(current_user, "distrito", "Lima Centro"),
    )


@router.get(
    "/users",
    response_model=list[dict[str, Any]],
    summary="Lista todos los usuarios del sistema (Admin y Supervisores)",
)
def list_users(
    db: Annotated[Any, Depends(get_db)],
    _current: Annotated[
        Usuario, Depends(verificar_rol(["administrador", "supervisor"]))
    ],
) -> list[dict[str, Any]]:
    """Devuelve la nómina completa de usuarios institucionales y sus roles."""
    return UserRepository.list_users(db=db)


@router.post(
    "/users",
    response_model=dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Registra un nuevo usuario institucional (Solo Administradores)",
)
def create_user(
    payload: RegisterRequest,
    db: Annotated[Any, Depends(get_db)],
    _admin: Annotated[
        Usuario, Depends(verificar_rol(["administrador"]))
    ],
) -> dict[str, Any]:
    """Crea una nueva cuenta con rol y contraseña segura."""
    try:
        new_u = UserRepository.create_user(
            nombre=payload.nombre,
            email=payload.email,
            password=payload.password,
            rol=payload.rol.value,
            distrito=payload.distrito,
            db=db,
        )
        AuditRepository.add_log(
            user=_admin.nombre,
            user_email=_admin.email,
            action="Creación de usuario institucional",
            action_type="config",
            details=f"Usuario {new_u['nombre']} ({new_u['email']}) creado con rol '{new_u['rol']}' en distrito '{new_u['distrito']}'.",
            status="success",
        )
        return new_u
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.put(
    "/users/{user_id}",
    response_model=dict[str, Any],
    summary="Actualiza datos, correo, distrito y rol de un usuario institucional (Solo Administradores)",
)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Annotated[Any, Depends(get_db)],
    _admin: Annotated[
        Usuario, Depends(verificar_rol(["administrador"]))
    ],
) -> dict[str, Any]:
    """Actualiza datos personales, correo electrónico y rol institucional de un funcionario."""
    try:
        updated = UserRepository.update_user(
            user_id=user_id,
            nombre=payload.nombre,
            email=payload.email,
            rol=payload.rol.value if payload.rol else None,
            distrito=payload.distrito,
            password=payload.password,
            db=db,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        AuditRepository.add_log(
            user=_admin.nombre,
            user_email=_admin.email,
            action="Actualización de usuario institucional",
            action_type="config",
            details=f"Funcionario ID {user_id} ({updated['nombre']}) actualizado: rol='{updated['rol']}', correo='{updated['email']}', distrito='{updated.get('distrito')}'.",
            status="success",
        )
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.delete(
    "/users/{user_id}",
    response_model=dict[str, Any],
    summary="Elimina permanentemente a un usuario del sistema (Solo Administradores)",
)
def delete_user(
    user_id: int,
    db: Annotated[Any, Depends(get_db)],
    _admin: Annotated[
        Usuario, Depends(verificar_rol(["administrador"]))
    ],
) -> dict[str, Any]:
    """Elimina una cuenta de usuario institucional y revoca sus credenciales."""
    # Evitar auto-eliminación por seguridad
    if _admin.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No es posible eliminar su propia cuenta de administrador en sesión.",
        )

    deleted = UserRepository.delete_user(user_id=user_id, db=db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    AuditRepository.add_log(
        user=_admin.nombre,
        user_email=_admin.email,
        action="Eliminación de usuario institucional",
        action_type="config",
        details=f"Usuario ID {user_id} eliminado de forma permanente del sistema por {_admin.nombre}.",
        status="warning",
    )
    return {"id": user_id, "deleted": True, "message": "Usuario eliminado exitosamente"}


@router.patch(
    "/users/{user_id}/status",
    response_model=dict[str, Any],
    summary="Activa o desactiva una cuenta de usuario (Solo Administradores)",
)
def toggle_user_status(
    user_id: int,
    db: Annotated[Any, Depends(get_db)],
    _admin: Annotated[
        Usuario, Depends(verificar_rol(["administrador"]))
    ],
) -> dict[str, Any]:
    """Cambia el estado activo/inactivo de un usuario."""
    res = UserRepository.toggle_status(user_id, db=db)
    if not res:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    nuevo_estado = "Activo" if res.get("activo") else "Inactivo"
    AuditRepository.add_log(
        user=_admin.nombre,
        user_email=_admin.email,
        action="Cambio de estado de usuario",
        action_type="config",
        details=f"Cuenta de {res.get('nombre')} ({res.get('email')}) cambiada a estado {nuevo_estado}.",
        status="success",
    )
    return res
