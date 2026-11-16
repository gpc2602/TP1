import math

# Metros aproximados por grado de latitud (constante global).
_METROS_POR_GRADO_LAT = 111_320.0


def _grados_lat(metros: float) -> float:
    return metros / _METROS_POR_GRADO_LAT


def _grados_lon(metros: float, lat: float) -> float:
    factor = _METROS_POR_GRADO_LAT * math.cos(math.radians(lat))
    # Evita division por cero cerca de los polos.
    return metros / max(factor, 1e-6)


def cuadrado_wkt(lat: float, lon: float, metros: float = 500.0) -> str:
    """Devuelve el WKT de un cuadrado de `metros` x `metros` centrado en (lat, lon).

    Aproximacion local valida para latitudes no polares (p. ej. Lima).
    El anillo exterior cierra con el primer vertice, como exige el estandar OGC.
    """
    dlat = _grados_lat(metros) / 2.0
    dlon = _grados_lon(metros, lat) / 2.0

    minx, maxx = lon - dlon, lon + dlon
    miny, maxy = lat - dlat, lat + dlat

    return (
        f"POLYGON(({minx} {miny}, {maxx} {miny}, "
        f"{maxx} {maxy}, {minx} {maxy}, {minx} {miny}))"
    )


def punto_wkt(lat: float, lon: float) -> str:
    """Devuelve el WKT de un POINT en (lat, lon)."""
    return f"POINT({lon} {lat})"
