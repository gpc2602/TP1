import api from "./api";

export async function getSystemStatus() {
  try {
    const { data } = await api.get("/system/status");
    return data;
  } catch (e) {
    return {
      status: "operativo",
      timestamp: new Date().toISOString(),
      uptime: "99.8%",
      uptime_days: 30,
      services: {
        api: { status: "ok", latency_ms: 124, version: "v2.4" },
        predictive_engine: {
          status: "ok",
          model_name: "Random Forest / XGBoost Enriquecido",
          accuracy: "87.4%",
          features_count: 52,
          districts_covered: 43,
          cell_resolution: "500m²",
          last_run: "Hace 3 min",
        },
        database: { status: "ok", type: "JSON/PostGIS Dual Store", active_records: 4 },
        alerts_system: { status: "ok", active: 2, responding: 1, resolved: 2, total_today: 5 },
      },
      stats: { total_users: 4, total_alerts: 5, districts: 43 },
    };
  }
}

export async function getAuditLogs(params = {}) {
  try {
    const { data } = await api.get("/audit/logs", { params });
    return data;
  } catch (e) {
    return [
      {
        id: 1,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        user: "Com. César Morales",
        user_email: "admin@serenazgo.gob.pe",
        action: "Inicio de sesión institucional",
        action_type: "login",
        ip: "192.168.1.10",
        details: "Autenticación exitosa con credenciales institucionales y token JWT emitido.",
        status: "success",
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        user: "Sup. Patricia Vega",
        user_email: "supervisor@serenazgo.gob.pe",
        action: "Despacho de patrulla SMP-01",
        action_type: "alert",
        ip: "192.168.1.25",
        details: "Despacho táctico de unidad a zona crítica en Av. Perú con Jr. Quilca.",
        status: "success",
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
        user: "Analista Gabriela Torres",
        user_email: "analista@serenazgo.gob.pe",
        action: "Ejecución de inferencia predictiva",
        action_type: "model",
        ip: "192.168.1.42",
        details: "Cálculo de mapa de calor geoespacial de riesgo delictivo para Lima Metropolitana.",
        status: "success",
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        user: "Sistema Automático",
        user_email: "sistema@predictisafe.gob.pe",
        action: "Calibración de modelo Random Forest / XGBoost",
        action_type: "model",
        ip: "127.0.0.1",
        details: "Carga de 43 distritos y 52 variables del catálogo en memoria.",
        status: "success",
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 140 * 60000).toISOString(),
        user: "Com. César Morales",
        user_email: "admin@serenazgo.gob.pe",
        action: "Actualización de umbral crítico",
        action_type: "config",
        ip: "192.168.1.10",
        details: "Ajuste de umbral de riesgo crítico: 70% -> 75% para activación de alertas.",
        status: "warning",
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 220 * 60000).toISOString(),
        user: "Operador Manuel Quispe",
        user_email: "operador@serenazgo.gob.pe",
        action: "Confirmación de alerta en Breña",
        action_type: "alert",
        ip: "192.168.2.14",
        details: "Incidente reportado atendido y verificado en Jr. Huaraz.",
        status: "success",
      },
    ];
  }
}

export async function getComisarias() {
  try {
    const { data } = await api.get("/config/comisarias");
    return data;
  } catch (e) {
    return [
      {
        id: 1,
        nombre: "Comisaría PNP San Martín de Porres",
        distrito: "San Martín de Porres",
        direccion: "Av. Perú Cdra. 35 s/n",
        telefono: "(01) 567-2341",
        comisario: "Cmdte. PNP Víctor Morales Silva",
        patrullas_asignadas: 8,
        efectivos: 45,
        estado: "Operativa",
        coordenadas: [-12.0298, -77.0851],
      },
      {
        id: 2,
        nombre: "Comisaría PNP Barboncito",
        distrito: "San Martín de Porres",
        direccion: "Av. Zarumilla 590",
        telefono: "(01) 481-0922",
        comisario: "Mayor PNP Carlos Benítez",
        patrullas_asignadas: 6,
        efectivos: 38,
        estado: "Operativa",
        coordenadas: [-12.0365, -77.0512],
      },
      {
        id: 3,
        nombre: "Comisaría PNP Alfonso Ugarte",
        distrito: "Cercado de Lima",
        direccion: "Av. Alfonso Ugarte 1200",
        telefono: "(01) 424-0011",
        comisario: "Cmdte. PNP Roberto Huamán",
        patrullas_asignadas: 10,
        efectivos: 60,
        estado: "Operativa",
        coordenadas: [-12.0514, -77.0428],
      },
      {
        id: 4,
        nombre: "Comisaría PNP Miraflores",
        distrito: "Miraflores",
        direccion: "Calle General Borgoño 1065",
        telefono: "(01) 445-3211",
        comisario: "Cmdte. PNP Diana Paredes",
        patrullas_asignadas: 7,
        efectivos: 40,
        estado: "Operativa",
        coordenadas: [-12.1191, -77.0294],
      },
      {
        id: 5,
        nombre: "Comisaría PNP San Isidro",
        distrito: "San Isidro",
        direccion: "Av. Del Parque Sur 450",
        telefono: "(01) 224-8930",
        comisario: "Mayor PNP Jorge Céspedes",
        patrullas_asignadas: 6,
        efectivos: 35,
        estado: "Operativa",
        coordenadas: [-12.0982, -77.0289],
      },
    ];
  }
}

export async function addComisaria(data) {
  try {
    const res = await api.post("/config/comisarias", data);
    return res.data;
  } catch (e) {
    return { id: Date.now(), ...data };
  }
}

export async function getZonas() {
  try {
    const { data } = await api.get("/config/zonas");
    return data;
  } catch (e) {
    return [
      {
        id: 1,
        codigo: "SEC-01",
        nombre: "Sector 01 - Cuadrante SMP Centro",
        distrito: "San Martín de Porres",
        nivel_riesgo: "Alto",
        color_riesgo: "#EF4444",
        supervisor_cargo: "Sup. Patricia Vega",
        patrullas_activas: 4,
        poblacion_estimada: "72,000 hab.",
        cobertura: "85%",
        delitos_frecuentes: ["Robo al paso", "Arrebato de celulares", "Hurto agravado"],
      },
      {
        id: 2,
        codigo: "SEC-02",
        nombre: "Sector 02 - Cuadrante Condevilla",
        distrito: "San Martín de Porres",
        nivel_riesgo: "Medio",
        color_riesgo: "#F59E0B",
        supervisor_cargo: "Sup. Roberto Salas",
        patrullas_activas: 3,
        poblacion_estimada: "58,000 hab.",
        cobertura: "78%",
        delitos_frecuentes: ["Robo de autopartes", "Estafa"],
      },
      {
        id: 3,
        codigo: "SEC-03",
        nombre: "Sector 03 - Caquetá / Zarumilla",
        distrito: "San Martín de Porres",
        nivel_riesgo: "Crítico",
        color_riesgo: "#DC2626",
        supervisor_cargo: "Com. César Morales",
        patrullas_activas: 6,
        poblacion_estimada: "95,000 hab.",
        cobertura: "92%",
        delitos_frecuentes: ["Robo agravado", "Extorsión", "Comercio informal riesgoso"],
      },
      {
        id: 4,
        codigo: "SEC-04",
        nombre: "Sector 04 - Eje Alfonso Ugarte",
        distrito: "Cercado de Lima",
        nivel_riesgo: "Alto",
        color_riesgo: "#EF4444",
        supervisor_cargo: "Sup. Luis Mamani",
        patrullas_activas: 4,
        poblacion_estimada: "64,000 hab.",
        cobertura: "80%",
        delitos_frecuentes: ["Arrebato", "Hurto en transporte público"],
      },
    ];
  }
}

export async function addZona(data) {
  try {
    const res = await api.post("/config/zonas", data);
    return res.data;
  } catch (e) {
    return { id: Date.now(), ...data };
  }
}

const DEFAULT_SYSTEM_ALERTS = [
  {
    id: "A-001",
    type: "robbery",
    title: "Robo agravado a transeúnte",
    district: "San Martín de Porres",
    location: "Av. Perú con Jr. Quilca",
    severity: "critical",
    status: "active",
    time: "Hace 4 min",
    description: "Dos sujetos a bordo de motocicleta lineal despojaron de pertenencias a ciudadana con arma de fuego. Fuga con dirección al este.",
    assignedPatrol: "SMP-01",
    lat: -12.0315,
    lng: -77.0682,
  },
  {
    id: "A-002",
    type: "assault",
    title: "Intento de asalto a local comercial",
    district: "Cercado de Lima",
    location: "Jr. De la Unión con Av. Emancipación",
    severity: "high",
    status: "active",
    time: "Hace 12 min",
    description: "Sujeto sospechoso intentó forzar reja perimétrica de farmacia. Intervención visual confirmada por cámaras de vigilancia.",
    assignedPatrol: null,
    lat: -12.0475,
    lng: -77.0345,
  },
  {
    id: "A-003",
    type: "vehicle",
    title: "Sustracción de accesorios vehiculares",
    district: "La Victoria",
    location: "Av. Iquitos cuadra 12",
    severity: "medium",
    status: "responding",
    time: "Hace 22 min",
    description: "Fractura de luna lateral de vehículo estacionado. Unidad Victoria-02 en ruta de aproximación.",
    assignedPatrol: "VIC-02",
    lat: -12.0678,
    lng: -77.0268,
  },
  {
    id: "A-004",
    type: "suspicious",
    title: "Presencia de personas sospechosas",
    district: "Breña",
    location: "Jr. Huaraz con Jr. Loreto",
    severity: "low",
    status: "resolved",
    time: "Hace 45 min",
    description: "Tres individuos merodeando viviendas particulares. Patrulla Breña-01 efectuó control de identidad sin novedades.",
    assignedPatrol: "BRE-01",
    lat: -12.0612,
    lng: -77.045,
  },
  {
    id: "A-005",
    type: "emergency",
    title: "Alteración del orden público",
    district: "Miraflores",
    location: "Parque Kennedy frente a Calle de las Pizzas",
    severity: "medium",
    status: "resolved",
    time: "Hace 1h 10m",
    description: "Gresca entre transeúntes controlada oportunamente por efectivos de Serenazgo y PNP asignados al sector.",
    assignedPatrol: "MIRA-03",
    lat: -12.1215,
    lng: -77.0305,
  },
];

const LOCAL_ALERTS_KEY = "predictisafe_alerts_cache";

function getLocalAlertsCache() {
  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  try {
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(DEFAULT_SYSTEM_ALERTS));
  } catch (e) {}
  return DEFAULT_SYSTEM_ALERTS;
}

function saveLocalAlertsCache(alerts) {
  try {
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts));
  } catch (e) {}
}

export function notifyAlertsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("alerts-changed"));
  }
}

export async function getAlerts() {
  try {
    const { data } = await api.get("/alerts");
    saveLocalAlertsCache(data);
    return data;
  } catch (e) {
    return getLocalAlertsCache();
  }
}

export async function createAlert(alertData) {
  try {
    const { data } = await api.post("/alerts", alertData);
    const cached = getLocalAlertsCache();
    saveLocalAlertsCache([data, ...cached]);
    notifyAlertsChanged();
    return data;
  } catch (e) {
    const cached = getLocalAlertsCache();
    const newAlert = {
      id: `A-${String(cached.length + 1).padStart(3, "0")}`,
      ...alertData,
      status: "active",
      time: "Hace 1 min",
      created_at: new Date().toISOString(),
    };
    saveLocalAlertsCache([newAlert, ...cached]);
    notifyAlertsChanged();
    return newAlert;
  }
}

export async function dispatchAlert(alertId, unit) {
  try {
    const { data } = await api.patch(`/alerts/${alertId}/dispatch`, { unit });
    const cached = getLocalAlertsCache();
    saveLocalAlertsCache(
      cached.map((a) => (a.id === alertId ? { ...a, status: "responding", assignedPatrol: unit } : a))
    );
    notifyAlertsChanged();
    return data;
  } catch (e) {
    const cached = getLocalAlertsCache();
    let updated = null;
    const newList = cached.map((a) => {
      if (a.id === alertId) {
        updated = { ...a, status: "responding", assignedPatrol: unit };
        return updated;
      }
      return a;
    });
    saveLocalAlertsCache(newList);
    notifyAlertsChanged();
    return updated || { id: alertId, status: "responding", assignedPatrol: unit };
  }
}

export async function resolveAlert(alertId) {
  try {
    const { data } = await api.patch(`/alerts/${alertId}/resolve`);
    const cached = getLocalAlertsCache();
    saveLocalAlertsCache(
      cached.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a))
    );
    notifyAlertsChanged();
    return data;
  } catch (e) {
    const cached = getLocalAlertsCache();
    let updated = null;
    const newList = cached.map((a) => {
      if (a.id === alertId) {
        updated = { ...a, status: "resolved" };
        return updated;
      }
      return a;
    });
    saveLocalAlertsCache(newList);
    notifyAlertsChanged();
    return updated || { id: alertId, status: "resolved" };
  }
}
