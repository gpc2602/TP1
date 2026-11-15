"""Script de inicializacion (seed) de PredictiSafe con los 4 roles oficiales.

Uso:
    python seed.py

Requiere la variable de entorno DATABASE_URL (driver asyncpg), p. ej.:
    postgresql+asyncpg://postgres:postgres@localhost:5432/predictisafe

Inserta de forma idempotente:
  * Los 4 usuarios institucionales oficiales (Administrador, Supervisor, Analista, Operador).
  * Tres cuadriculas de riesgo de prueba (500x500 m) en Lima.
"""

from __future__ import annotations

import asyncio
import os
import sys
from decimal import Decimal

from sqlalchemy import func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.geo import cuadrado_wkt
from app.core.security import hash_password
from app.models import Base, CuadriculaRiesgo, NivelRiesgo, RolUsuario, Usuario

# ---------------------------------------------------------------------------
# Cuentas institucionales oficiales por rol
# ---------------------------------------------------------------------------
USUARIOS_SEED = [
    {
        "nombre": "Com. César Morales",
        "email": "admin@serenazgo.gob.pe",
        "password": "Admin2026!",
        "rol": RolUsuario.administrador,
    },
    {
        "nombre": "Sup. Patricia Vega",
        "email": "supervisor@serenazgo.gob.pe",
        "password": "Supervisor2026!",
        "rol": RolUsuario.supervisor,
    },
    {
        "nombre": "Analista Gabriela Torres",
        "email": "analista@serenazgo.gob.pe",
        "password": "Analista2026!",
        "rol": RolUsuario.analista,
    },
    {
        "nombre": "Operador Manuel Quispe",
        "email": "operador@serenazgo.gob.pe",
        "password": "Operador2026!",
        "rol": RolUsuario.operador,
    },
]

# (nombre_zona, lat, lon, nivel, probabilidad)
CUADRICULAS_SEED: list[tuple[str, float, float, NivelRiesgo, float]] = [
    ("Cercado de Lima", -12.0464, -77.0428, NivelRiesgo.alto, 0.72),
    ("San Juan de Lurigancho", -11.9896, -77.0103, NivelRiesgo.critico, 0.88),
    ("Miraflores", -12.1191, -77.0294, NivelRiesgo.bajo, 0.18),
]


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        sys.exit("ERROR: define la variable de entorno DATABASE_URL antes de ejecutar seed.py")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


async def _seed_usuarios(db: AsyncSession) -> None:
    for u in USUARIOS_SEED:
        existente = await db.execute(select(Usuario).where(Usuario.email == u["email"]))
        if existente.scalar_one_or_none() is not None:
            print(f"[seed] Usuario ya existe: {u['email']} ({u['rol'].value})")
            continue

        db.add(
            Usuario(
                nombre=u["nombre"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                rol=u["rol"],
                activo=True,
            )
        )
        print(f"[seed] Usuario creado: {u['email']} / {u['password']} [{u['rol'].value}]")


async def _seed_cuadriculas(db: AsyncSession) -> None:
    total = (await db.execute(select(func.count()).select_from(CuadriculaRiesgo))).scalar_one()
    if total:
        print(f"[seed] Ya existen {total} cuadriculas; se omite la insercion de prueba.")
        return

    for nombre, lat, lon, nivel, probabilidad in CUADRICULAS_SEED:
        wkt = cuadrado_wkt(lat, lon, metros=500.0)
        await db.execute(
            insert(CuadriculaRiesgo).values(
                poligono=func.ST_GeomFromText(wkt, 4326),
                nivel_riesgo=nivel,
                probabilidad_predicha=Decimal(str(probabilidad)),
                modelo_version="seed",
            )
        )
        print(f"[seed] Cuadricula insertada: {nombre} ({nivel.value}, {probabilidad})")


async def main() -> None:
    engine = create_async_engine(_database_url(), echo=False, future=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        try:
            await _seed_usuarios(db)
            await _seed_cuadriculas(db)
            await db.commit()
            print("[seed] Completado correctamente con los 4 roles.")
        except Exception:
            await db.rollback()
            raise

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
