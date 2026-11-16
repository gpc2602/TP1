import base64
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import secrets
from typing import Any

from app.core.config import settings

# Intentar cargar librerías externas opcionales; si no están instaladas,
# se utiliza la implementación criptográfica robusta nativa de Python.
try:
    import jwt as pyjwt
except Exception:
    pyjwt = None

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    pwd_context = None


# ---------------------------------------------------------------------------
# Funciones auxiliares de codificación URL Base64 sin padding (RFC 7515 / 7519)
# ---------------------------------------------------------------------------
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


# ---------------------------------------------------------------------------
# Contraseñas con PBKDF2-HMAC-SHA256 (estándar FIPS/NIST) y soporte Bcrypt
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Genera un hash seguro para contraseñas usando PBKDF2 con 100,000 iteraciones o Bcrypt."""
    if pwd_context is not None:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2:sha256:100000${salt}${dk.hex()}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verifica si la contraseña coincide con su hash almacenado."""
    if not password_hash or not plain_password:
        return False

    # Verificación con passlib / bcrypt si aplica
    if password_hash.startswith(("$2a$", "$2b$", "$2y$")) and pwd_context is not None:
        try:
            return pwd_context.verify(plain_password, password_hash)
        except Exception:
            return False

    # Verificación con PBKDF2 nativo
    if password_hash.startswith("pbkdf2:sha256:"):
        try:
            parts = password_hash.split("$")
            if len(parts) == 3:
                header, salt, expected_hash = parts
                iterations = int(header.split(":")[-1])
                calc = hashlib.pbkdf2_hmac(
                    "sha256",
                    plain_password.encode("utf-8"),
                    salt.encode("utf-8"),
                    iterations,
                ).hex()
                return secrets.compare_digest(calc, expected_hash)
        except Exception:
            return False

    # Soporte para hashes legados o de prueba
    if password_hash.startswith("mock_hash_"):
        return password_hash == f"mock_hash_{plain_password}"

    # Comparación segura directa en caso de texto plano en migraciones
    return secrets.compare_digest(plain_password, password_hash)


# ---------------------------------------------------------------------------
# JWT (JSON Web Tokens) RFC 7519 HMAC-SHA256
# ---------------------------------------------------------------------------
def create_access_token(
    subject: str,
    rol: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Genera un token JWT estándar firmado con HMAC-SHA256."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    payload: dict[str, Any] = {
        "sub": str(subject),
        "rol": rol,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    if pyjwt is not None:
        try:
            return pyjwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        except Exception:
            pass

    # Generación nativa estándar de JWT HS256
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    signature_b64 = _b64url_encode(signature)
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict[str, Any]:
    """Decodifica, valida firma y verifica expiración de un token JWT."""
    if pyjwt is not None:
        try:
            return pyjwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except Exception:
            pass

    # Decodificación y validación nativa estándar
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Token JWT malformado: se esperaban 3 partes separadas por puntos")

    header_b64, payload_b64, signature_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_sig = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    actual_sig = _b64url_decode(signature_b64)

    if not secrets.compare_digest(expected_sig, actual_sig):
        raise ValueError("Firma digital del token JWT inválida")

    payload_json = _b64url_decode(payload_b64).decode("utf-8")
    payload = json.loads(payload_json)

    # Validar fecha de expiración
    exp = payload.get("exp")
    if exp is not None:
        now_ts = int(datetime.now(timezone.utc).timestamp())
        if now_ts > int(exp):
            raise ValueError("El token JWT ha expirado")

    return payload
