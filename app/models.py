from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import Any

# ---------------------------------------------------------------------------
# Enumeraciones (se mapean a los tipos ENUM definidos en PostGIS)
# ---------------------------------------------------------------------------
class RolUsuario(str, enum.Enum):
    supervisor = "supervisor"
    operador = "operador"
    analista = "analista"
    administrador = "administrador"


class NivelRiesgo(str, enum.Enum):
    bajo = "Bajo"
    medio = "Medio"
    alto = "Alto"
    critico = "Critico"


class NivelSeveridad(str, enum.Enum):
    baja = "Baja"
    media = "Media"
    alta = "Alta"
    critica = "Critica"


def _enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    """Persiste el .value de cada miembro (no el .name) en la BD."""
    return [member.value for member in enum_cls]


try:
    from geoalchemy2 import Geometry
    from sqlalchemy import (
        BigInteger,
        Boolean,
        CheckConstraint,
        DateTime,
        Enum as SAEnum,
        ForeignKey,
        Numeric,
        String,
        Text,
        func,
    )
    from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

    class Base(DeclarativeBase):
        """Clase base declarativa de SQLAlchemy 2.0."""

    class Usuario(Base):
        __tablename__ = "usuarios"

        id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
        nombre: Mapped[str] = mapped_column(String(150), nullable=False)
        email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
        password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
        rol: Mapped[RolUsuario] = mapped_column(
            SAEnum(RolUsuario, name="rol_usuario", values_callable=_enum_values),
            nullable=False,
            server_default=RolUsuario.operador.value,
        )
        activo: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
        creado_en: Mapped[datetime] = mapped_column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        )

        incidentes: Mapped[list["Incidente"]] = relationship(
            back_populates="usuario_reporta", lazy="selectin"
        )
        alertas_emitidas: Mapped[list["Alerta"]] = relationship(
            back_populates="emisor", lazy="selectin"
        )

        def __repr__(self) -> str:
            return f"<Usuario id={self.id} email={self.email!r} rol={self.rol}>"

    class Incidente(Base):
        __tablename__ = "incidentes"

        id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
        coordenada: Mapped[str] = mapped_column(
            Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
            nullable=False,
        )
        tipo_delito: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
        fecha_hora: Mapped[datetime] = mapped_column(
            DateTime(timezone=True), nullable=False, index=True
        )
        descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
        reportado_por: Mapped[int | None] = mapped_column(
            BigInteger, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
        )
        creado_en: Mapped[datetime] = mapped_column(
            DateTime(timezone=True), nullable=False, server_default=func.now()
        )

        usuario_reporta: Mapped["Usuario | None"] = relationship(
            back_populates="incidentes"
        )

    class CuadriculaRiesgo(Base):
        __tablename__ = "cuadriculas_riesgo"

        id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
        poligono: Mapped[str] = mapped_column(
            Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
            nullable=False,
        )
        nivel_riesgo: Mapped[NivelRiesgo] = mapped_column(
            SAEnum(NivelRiesgo, name="nivel_riesgo", values_callable=_enum_values),
            nullable=False,
            index=True,
        )
        probabilidad_predicha: Mapped[Decimal] = mapped_column(
            Numeric(5, 4),
            CheckConstraint(
                "probabilidad_predicha >= 0 AND probabilidad_predicha <= 1",
                name="ck_cuadricula_probabilidad",
            ),
            nullable=False,
        )
        modelo_version: Mapped[str] = mapped_column(String(50), nullable=False)
        calculado_en: Mapped[datetime] = mapped_column(
            DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
        )

        alertas: Mapped[list["Alerta"]] = relationship(
            back_populates="cuadricula", lazy="selectin"
        )

    class Alerta(Base):
        __tablename__ = "alertas"

        id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
        coordenada: Mapped[str] = mapped_column(
            Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
            nullable=False,
        )
        descripcion: Mapped[str] = mapped_column(Text, nullable=False)
        severidad: Mapped[NivelSeveridad] = mapped_column(
            SAEnum(NivelSeveridad, name="nivel_severidad", values_callable=_enum_values),
            nullable=False,
            server_default=NivelSeveridad.media.value,
            index=True,
        )
        fecha_creacion: Mapped[datetime] = mapped_column(
            DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
        )
        cuadricula_id: Mapped[int | None] = mapped_column(
            BigInteger, ForeignKey("cuadriculas_riesgo.id", ondelete="SET NULL"), nullable=True
        )
        emitida_por: Mapped[int | None] = mapped_column(
            BigInteger, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
        )

        cuadricula: Mapped["CuadriculaRiesgo | None"] = relationship(
            back_populates="alertas"
        )
        emisor: Mapped["Usuario | None"] = relationship(
            back_populates="alertas_emitidas"
        )

        def __repr__(self) -> str:
            return f"<Alerta id={self.id} severidad={self.severidad}>"

except Exception:
    class Base:
        metadata = None

    class Usuario:
        def __init__(self, id=1, nombre="Admin", email="admin@serenazgo.gob.pe", rol=RolUsuario.administrador, activo=True):
            self.id = id
            self.nombre = nombre
            self.email = email
            self.rol = rol
            self.activo = activo

    class CuadriculaRiesgo:
        def __init__(self, id=1, poligono=None, nivel_riesgo=NivelRiesgo.medio, probabilidad_predicha=Decimal("0.5"), modelo_version="v1"):
            self.id = id
            self.poligono = poligono
            self.nivel_riesgo = nivel_riesgo
            self.probabilidad_predicha = probabilidad_predicha
            self.modelo_version = modelo_version

    class Incidente:
        pass

    class Alerta:
        def __init__(self, id=1, coordenada=None, descripcion="", severidad=NivelSeveridad.media, cuadricula_id=1, emitida_por=1):
            self.id = id
            self.coordenada = coordenada
            self.descripcion = descripcion
            self.severidad = severidad
            self.cuadricula_id = cuadricula_id
            self.emitida_por = emitida_por
