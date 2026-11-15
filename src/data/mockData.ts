export type RiskLevel = 'low' | 'med-low' | 'medium' | 'med-high' | 'high' | 'critical';

export interface GridCell {
  id: string;
  lat: number;
  lng: number;
  risk: number; // 0-1
  level: RiskLevel;
  district: string;
  incidents: number;
  topFactors: { name: string; value: number }[];
}

export interface Patrol {
  id: string;
  unit: string;
  officer: string;
  status: 'active' | 'standby' | 'returning';
  position: [number, number];
  route: [number, number][];
  coverage: string;
  lastUpdate: string;
}

export interface Alert {
  id: string;
  type: 'robbery' | 'assault' | 'vehicle' | 'suspicious' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  district: string;
  time: string;
  status: 'active' | 'responding' | 'resolved';
  description: string;
  coordinates: [number, number];
}

export interface DistrictStat {
  name: string;
  risk: number;
  incidents: number;
  patrols: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

const limaDistricts = [
  'Miraflores', 'San Isidro', 'Surco', 'San Borja', 'La Molina',
  'Barranco', 'Chorrillos', 'Surquillo', 'San Miguel', 'Pueblo Libre',
  'Jesús María', 'Lince', 'Magdalena', 'Breña', 'Rímac',
  'La Victoria', 'El Agustino', 'Santa Anita', 'San Juan de Lurigancho',
  'Los Olivos', 'Independencia', 'Comas', 'Carabayllo', 'Puente Piedra'
];

function getRiskLevel(r: number): RiskLevel {
  if (r < 0.15) return 'low';
  if (r < 0.3) return 'med-low';
  if (r < 0.5) return 'medium';
  if (r < 0.7) return 'med-high';
  if (r < 0.85) return 'high';
  return 'critical';
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateHeatGrid(): GridCell[] {
  const cells: GridCell[] = [];
  const latStart = -12.18;
  const latEnd = -11.85;
  const lngStart = -77.18;
  const lngEnd = -76.85;
  const cellSize = 0.0045;

  const hotspots: [number, number, number][] = [
    [-12.055, -77.04, 0.85],
    [-12.065, -77.03, 0.75],
    [-12.048, -77.065, 0.72],
    [-12.08, -77.01, 0.68],
    [-12.03, -77.08, 0.60],
    [-11.98, -77.07, 0.55],
    [-12.15, -77.01, 0.78],
    [-12.1, -76.95, 0.5],
    [-12.07, -77.1, 0.45],
    [-11.9, -77.05, 0.4],
  ];

  let idx = 0;
  for (let lat = latStart; lat < latEnd; lat += cellSize) {
    for (let lng = lngStart; lng < lngEnd; lng += cellSize) {
      idx++;
      let baseRisk = seededRandom(idx * 7.3) * 0.3;

      for (const [hLat, hLng, intensity] of hotspots) {
        const dist = Math.sqrt((lat - hLat) ** 2 + (lng - hLng) ** 2);
        const influence = intensity * Math.exp(-dist * 120);
        baseRisk = Math.max(baseRisk, influence);
      }
      baseRisk = Math.min(1, baseRisk + seededRandom(idx * 3.1) * 0.1);

      const distIdx = Math.floor(seededRandom(idx * 5.7) * limaDistricts.length);
      const district = limaDistricts[distIdx];
      const level = getRiskLevel(baseRisk);
      const incidents = Math.floor(baseRisk * 45 + seededRandom(idx) * 8);

      cells.push({
        id: `cell-${idx}`,
        lat: Math.round(lat * 10000) / 10000,
        lng: Math.round(lng * 10000) / 10000,
        risk: Math.round(baseRisk * 100) / 100,
        level,
        district,
        incidents,
        topFactors: [
          { name: 'Hora nocturna', value: Math.round(seededRandom(idx * 2) * 0.85 * 100) / 100 },
          { name: 'Densidad peatonal', value: Math.round(seededRandom(idx * 4) * 0.7 * 100) / 100 },
          { name: 'Historial delitos', value: Math.round(baseRisk * 0.9 * 100) / 100 },
          { name: 'Iluminación', value: Math.round(seededRandom(idx * 6) * 0.6 * 100) / 100 },
          { name: 'Patrullaje previo', value: Math.round(seededRandom(idx * 8) * 0.5 * 100) / 100 },
        ],
      });
    }
  }
  return cells;
}

export const mockPatrols: Patrol[] = [
  {
    id: 'P-01', unit: 'Unidad 07', officer: 'Sgt. Carlos Mendoza',
    status: 'active', position: [-12.048, -77.042],
    route: [[-12.048, -77.042], [-12.052, -77.045], [-12.055, -77.04], [-12.058, -77.038]],
    coverage: 'Miraflores Norte', lastUpdate: 'hace 2 min',
  },
  {
    id: 'P-02', unit: 'Unidad 12', officer: 'Sgt. Ana Torres',
    status: 'active', position: [-12.065, -77.035],
    route: [[-12.065, -77.035], [-12.068, -77.03], [-12.07, -77.025]],
    coverage: 'San Isidro Centro', lastUpdate: 'hace 1 min',
  },
  {
    id: 'P-03', unit: 'Unidad 05', officer: 'Sgt. Luis García',
    status: 'standby', position: [-12.08, -77.01],
    route: [[-12.08, -77.01]],
    coverage: 'Surco Este', lastUpdate: 'hace 5 min',
  },
  {
    id: 'P-04', unit: 'Unidad 19', officer: 'Sgt. María Quispe',
    status: 'returning', position: [-12.038, -77.058],
    route: [[-12.038, -77.058], [-12.042, -77.055], [-12.045, -77.05]],
    coverage: 'San Miguel', lastUpdate: 'hace 3 min',
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'A-001', type: 'robbery', severity: 'critical',
    location: 'Av. Larco cdra. 12', district: 'Miraflores',
    time: '23:47', status: 'active',
    description: 'Robo a mano armada reportado por 2 ciudadanos. Sospechosos huyeron en mototaxi rojo.',
    coordinates: [-12.121, -77.030],
  },
  {
    id: 'A-002', type: 'suspicious', severity: 'high',
    location: 'Jr. Camaná cdra. 4', district: 'Cercado',
    time: '23:31', status: 'responding',
    description: 'Grupo de 4 personas con actitud sospechosa cerca de cajero automático BCP.',
    coordinates: [-12.052, -77.033],
  },
  {
    id: 'A-003', type: 'vehicle', severity: 'high',
    location: 'Av. Javier Prado Este 3200', district: 'San Borja',
    time: '23:18', status: 'responding',
    description: 'Vehículo reportado como robado detectado por cámara de vigilancia.',
    coordinates: [-12.088, -76.999],
  },
  {
    id: 'A-004', type: 'assault', severity: 'medium',
    location: 'Parque Kennedy', district: 'Miraflores',
    time: '22:55', status: 'resolved',
    description: 'Intento de arrebato de celular. Detenido por patrullero P-01.',
    coordinates: [-12.119, -77.031],
  },
  {
    id: 'A-005', type: 'emergency', severity: 'critical',
    location: 'Av. Brasil cdra. 8', district: 'Breña',
    time: '22:40', status: 'active',
    description: 'Llamada de emergencia 105. Persona herida en la vía pública.',
    coordinates: [-12.072, -77.052],
  },
  {
    id: 'A-006', type: 'robbery', severity: 'medium',
    location: 'Mercado Surquillo', district: 'Surquillo',
    time: '22:12', status: 'resolved',
    description: 'Robo de cartera a transeúnte. Sospechoso identificado.',
    coordinates: [-12.108, -77.022],
  },
];

export const districtStats: DistrictStat[] = [
  { name: 'La Victoria', risk: 0.87, incidents: 47, patrols: 3, trend: 'up', change: 12 },
  { name: 'Rímac', risk: 0.79, incidents: 38, patrols: 4, trend: 'up', change: 8 },
  { name: 'El Agustino', risk: 0.74, incidents: 35, patrols: 3, trend: 'stable', change: 0 },
  { name: 'Breña', risk: 0.68, incidents: 29, patrols: 4, trend: 'down', change: -5 },
  { name: 'SJL', risk: 0.65, incidents: 52, patrols: 6, trend: 'up', change: 7 },
  { name: 'Cercado', risk: 0.62, incidents: 31, patrols: 5, trend: 'down', change: -3 },
  { name: 'Surquillo', risk: 0.51, incidents: 22, patrols: 3, trend: 'stable', change: 1 },
  { name: 'Miraflores', risk: 0.34, incidents: 14, patrols: 8, trend: 'down', change: -9 },
  { name: 'San Isidro', risk: 0.22, incidents: 8, patrols: 6, trend: 'down', change: -4 },
  { name: 'La Molina', risk: 0.18, incidents: 5, patrols: 4, trend: 'stable', change: 0 },
];

export const hourlyData = [
  { hour: '00h', incidents: 18, risk: 0.72 },
  { hour: '01h', incidents: 22, risk: 0.81 },
  { hour: '02h', incidents: 25, risk: 0.88 },
  { hour: '03h', incidents: 20, risk: 0.78 },
  { hour: '04h', incidents: 12, risk: 0.52 },
  { hour: '05h', incidents: 8, risk: 0.38 },
  { hour: '06h', incidents: 6, risk: 0.28 },
  { hour: '07h', incidents: 9, risk: 0.35 },
  { hour: '08h', incidents: 14, risk: 0.48 },
  { hour: '09h', incidents: 11, risk: 0.42 },
  { hour: '10h', incidents: 10, risk: 0.40 },
  { hour: '11h', incidents: 13, risk: 0.47 },
  { hour: '12h', incidents: 16, risk: 0.58 },
  { hour: '13h', incidents: 18, risk: 0.62 },
  { hour: '14h', incidents: 15, risk: 0.55 },
  { hour: '15h', incidents: 12, risk: 0.48 },
  { hour: '16h', incidents: 14, risk: 0.52 },
  { hour: '17h', incidents: 19, risk: 0.65 },
  { hour: '18h', incidents: 24, risk: 0.75 },
  { hour: '19h', incidents: 28, risk: 0.82 },
  { hour: '20h', incidents: 32, risk: 0.86 },
  { hour: '21h', incidents: 30, risk: 0.84 },
  { hour: '22h', incidents: 27, risk: 0.79 },
  { hour: '23h', incidents: 24, risk: 0.74 },
];

export const weeklyTrend = [
  { day: 'Lun', incidents: 142, predicted: 138 },
  { day: 'Mar', incidents: 158, predicted: 152 },
  { day: 'Mié', incidents: 134, predicted: 141 },
  { day: 'Jue', incidents: 167, predicted: 163 },
  { day: 'Vie', incidents: 189, predicted: 195 },
  { day: 'Sáb', incidents: 221, predicted: 218 },
  { day: 'Dom', incidents: 198, predicted: 202 },
];

export const shapFeatures = [
  { feature: 'Hora del día (22-02h)', shap: 0.312, direction: 'positive' as const },
  { feature: 'Historial del sector', shap: 0.287, direction: 'positive' as const },
  { feature: 'Densidad peatonal', shap: 0.241, direction: 'positive' as const },
  { feature: 'Ausencia de patrullaje', shap: 0.198, direction: 'positive' as const },
  { feature: 'Temperatura < 16°C', shap: 0.143, direction: 'positive' as const },
  { feature: 'Día fin de semana', shap: 0.127, direction: 'positive' as const },
  { feature: 'Iluminación deficiente', shap: 0.118, direction: 'positive' as const },
  { feature: 'Proximidad a comercios', shap: -0.089, direction: 'negative' as const },
  { feature: 'Cobertura de cámaras', shap: -0.134, direction: 'negative' as const },
  { feature: 'Patrullaje activo', shap: -0.178, direction: 'negative' as const },
];

export const crimeTypes = [
  { type: 'Robo al paso', count: 342, pct: 38 },
  { type: 'Robo de vehículo', count: 198, pct: 22 },
  { type: 'Asalto', count: 152, pct: 17 },
  { type: 'Arrebato', count: 121, pct: 13 },
  { type: 'Otros', count: 90, pct: 10 },
];
