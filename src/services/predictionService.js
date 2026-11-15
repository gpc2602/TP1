import api from "./api";
import localCatalogos from "../data/catalogos_frontend.json";

// Mapeo entre modalidades del dataset y etiquetas amigables
export const MODALIDADES_DELITO = [
  { value: "ROBO", label: "Robo" },
  { value: "HURTO", label: "Hurto" },
  { value: "ESTAFA", label: "Estafa" },
  { value: "EXTORSIÓN", label: "Extorsión" },
  { value: "VIOLENCIA CONTRA LA MUJER E INTEGRANTES", label: "Violencia Familiar / Género" },
  { value: "SECUESTRO", label: "Secuestro" },
  { value: "OTROS", label: "Otros delitos" },
];

export const DISTRITOS_LIMA = localCatalogos?.distritos || [
  "ANCON", "ATE", "BARRANCO", "BREÑA", "CARABAYLLO", "CHACLACAYO", "CHORRILLOS",
  "CIENEGUILLA", "COMAS", "EL AGUSTINO", "INDEPENDENCIA", "JESUS MARIA", "LA MOLINA",
  "LA VICTORIA", "LIMA", "LINCE", "LOS OLIVOS", "LURIGANCHO", "LURIN", "MAGDALENA DEL MAR",
  "MIRAFLORES", "PACHACAMAC", "PUCUSANA", "PUEBLO LIBRE", "PUENTE PIEDRA", "PUNTA HERMOSA",
  "PUNTA NEGRA", "RIMAC", "SAN BARTOLO", "SAN BORJA", "SAN ISIDRO", "SAN JUAN DE LURIGANCHO",
  "SAN JUAN DE MIRAFLORES", "SAN LUIS", "SAN MARTIN DE PORRES", "SAN MIGUEL", "SANTA ANITA",
  "SANTA MARIA DEL MAR", "SANTA ROSA", "SANTIAGO DE SURCO", "SURQUILLO", "VILLA EL SALVADOR",
  "VILLA MARIA DEL TRIUNFO",
];

/**
 * Obtiene el mapa de calor con predicciones masivas de los 43 distritos desde el modelo ML de FastAPI.
 */
export async function obtenerMapaCalor(anio = 2026, mes = 12, modalidad = "ROBO") {
  try {
    const { data } = await api.get("/predict/mapa-calor", {
      params: { anio, mes, modalidad },
    });
    return { ...data, isLive: true };
  } catch (error) {
    console.warn("API de predicción no disponible, usando fallback local:", error.message);

    // Fallback con datos calculados localmente
    const fallbackZonas = DISTRITOS_LIMA.map((dist) => {
      const coords = localCatalogos?.coordenadas?.[dist] || [-12.0464, -77.0428];
      let base = 25;
      if (["SAN JUAN DE LURIGANCHO", "LIMA", "COMAS", "SAN MARTIN DE PORRES", "ATE"].includes(dist)) {
        base = 135;
      } else if (["LOS OLIVOS", "SANTIAGO DE SURCO", "VILLA EL SALVADOR", "CHORRILLOS"].includes(dist)) {
        base = 85;
      }
      const nivel = base >= 150 ? "critical" : base >= 80 ? "high" : base >= 35 ? "medium" : "low";

      return {
        id: `cell-${dist}`,
        distrito: dist,
        modalidad: modalidad.toUpperCase(),
        anio,
        mes,
        denuncias_estimadas: base,
        nivel_riesgo: nivel,
        probabilidad: Math.min(1.0, base / 250),
        coordenadas: { lat: coords[0], lng: coords[1] },
        factores: [
          { name: "Iluminación deficiente", value: 0.35 },
          { name: "Brecha videovigilancia", value: 0.28 },
          { name: "Estacionalidad mensual", value: 0.22 },
        ],
      };
    });

    const criticas = fallbackZonas.filter((z) => z.nivel_riesgo === "critical").length;
    const altas = fallbackZonas.filter((z) => z.nivel_riesgo === "high").length;
    const totalDenuncias = fallbackZonas.reduce((acc, z) => acc + z.denuncias_estimadas, 0);

    return {
      anio,
      mes,
      modalidad,
      total_zonas: fallbackZonas.length,
      total_denuncias: totalDenuncias,
      zonas_criticas: criticas,
      zonas_altas: altas,
      distrito_mayor_incidencia: "SAN JUAN DE LURIGANCHO",
      zonas: fallbackZonas,
      isLive: false,
    };
  }
}

/**
 * Predice denuncias puntuales para un distrito específico.
 */
export async function predecirDelitoIndividual(anio, mes, distrito, modalidad) {
  try {
    const { data } = await api.post("/predict/delitos", {
      anio,
      mes,
      distrito,
      modalidad,
    });
    return data;
  } catch (error) {
    console.warn("Error en predicción puntual:", error.message);
    const coords = localCatalogos?.coordenadas?.[distrito.toUpperCase()] || [-12.0464, -77.0428];
    return {
      id: `cell-${distrito.toUpperCase()}`,
      distrito: distrito.toUpperCase(),
      modalidad: modalidad.toUpperCase(),
      anio,
      mes,
      denuncias_estimadas: 45,
      nivel_riesgo: "medium",
      probabilidad: 0.35,
      coordenadas: { lat: coords[0], lng: coords[1] },
      factores: [{ name: "Iluminación deficiente", value: 0.3 }],
    };
  }
}

/**
 * Obtiene catálogos desde el backend o desde el JSON local.
 */
export async function obtenerCatalogos() {
  try {
    const { data } = await api.get("/predict/catalogos");
    return data;
  } catch {
    return localCatalogos;
  }
}
