import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Radio,
  Zap,
  Shield,
  Gauge,
  Fuel,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface PatrolUnit {
  id: string;
  unit: string;
  officer: string;
  district: string;
  coverage: string;
  status: "active" | "standby" | "responding";
  color: string;
  speedKmH: number;
  batteryPct: number;
  waypoints: [number, number][];
  currentPosIndex: number;
  progressBetweenPoints: number;
}

const INITIAL_PATROLS: PatrolUnit[] = [
  {
    id: "P-SMP-01",
    unit: "SMP-01",
    officer: "Cmdte. Morales / Sup. Vega",
    district: "San Martín de Porres",
    coverage: "Sector 01 · Av. Perú / Jr. Quilca / Caquetá",
    status: "active",
    color: "#EF4444",
    speedKmH: 38,
    batteryPct: 92,
    waypoints: [
      [-12.0315, -77.0682],
      [-12.0345, -77.0612],
      [-12.0382, -77.0545],
      [-12.0350, -77.0490],
      [-12.0298, -77.0560],
      [-12.0285, -77.0630],
    ],
    currentPosIndex: 0,
    progressBetweenPoints: 0,
  },
  {
    id: "P-SMP-02",
    unit: "SMP-02",
    officer: "Oficial Benítez / Soto",
    district: "San Martín de Porres",
    coverage: "Sector 02 · Condevilla / Universitaria",
    status: "active",
    color: "#F59E0B",
    speedKmH: 32,
    batteryPct: 84,
    waypoints: [
      [-12.0150, -77.0780],
      [-12.0195, -77.0720],
      [-12.0240, -77.0790],
      [-12.0220, -77.0850],
      [-12.0165, -77.0830],
    ],
    currentPosIndex: 1,
    progressBetweenPoints: 0,
  },
  {
    id: "P-LIM-01",
    unit: "LIM-01",
    officer: "Cmdte. Huamán / Salas",
    district: "Cercado de Lima",
    coverage: "Sector 04 · Eje Alfonso Ugarte / Av. Emancipación",
    status: "active",
    color: "#3B82F6",
    speedKmH: 28,
    batteryPct: 78,
    waypoints: [
      [-12.0450, -77.0420],
      [-12.0490, -77.0390],
      [-12.0535, -77.0435],
      [-12.0495, -77.0470],
      [-12.0460, -77.0450],
    ],
    currentPosIndex: 2,
    progressBetweenPoints: 0,
  },
  {
    id: "P-VIC-01",
    unit: "VIC-01",
    officer: "Cmdte. Salazar / Quispe",
    district: "La Victoria",
    coverage: "Sector 08 · Emporio Gamarra / Av. Iquitos",
    status: "responding",
    color: "#EC4899",
    speedKmH: 44,
    batteryPct: 69,
    waypoints: [
      [-12.0645, -77.0250],
      [-12.0680, -77.0210],
      [-12.0720, -77.0245],
      [-12.0690, -77.0285],
      [-12.0655, -77.0270],
    ],
    currentPosIndex: 3,
    progressBetweenPoints: 0,
  },
  {
    id: "P-MIRA-01",
    unit: "MIRA-01",
    officer: "Cmdte. Paredes / Ríos",
    district: "Miraflores",
    coverage: "Sector 05 · Av. Larco / Malecón de la Reserva",
    status: "active",
    color: "#10B981",
    speedKmH: 30,
    batteryPct: 95,
    waypoints: [
      [-12.1180, -77.0290],
      [-12.1220, -77.0315],
      [-12.1265, -77.0340],
      [-12.1240, -77.0375],
      [-12.1195, -77.0330],
    ],
    currentPosIndex: 0,
    progressBetweenPoints: 0,
  },
];

// Celdas de riesgo real modeladas según XGBoost / Random Forest en Lima
const REAL_CRITICAL_CELLS = [
  { id: "c1", lat: -12.032, lng: -77.065, risk: 0.88, label: "Caquetá / Zarumilla (SMP)", level: "critical" },
  { id: "c2", lat: -12.036, lng: -77.058, risk: 0.82, label: "Av. Perú cuadra 32", level: "high" },
  { id: "c3", lat: -12.048, lng: -77.043, risk: 0.79, label: "Alfonso Ugarte Centro", level: "high" },
  { id: "c4", lat: -12.067, lng: -77.026, risk: 0.85, label: "Gamarra / Av. Iquitos", level: "critical" },
  { id: "c5", lat: -12.019, lng: -77.075, risk: 0.74, label: "Condevilla / Universitaria", level: "med-high" },
  { id: "c6", lat: -12.061, lng: -77.045, risk: 0.65, label: "Jr. Huaraz Breña", level: "medium" },
  { id: "c7", lat: -12.121, lng: -77.032, risk: 0.42, label: "Parque Kennedy Miraflores", level: "low" },
];

const CELL_SIZE = 0.005;
const RISK_COLORS: Record<string, string> = {
  low: "rgba(16,185,129,0.35)",
  medium: "rgba(234,179,8,0.4)",
  "med-high": "rgba(249,115,22,0.45)",
  high: "rgba(239,68,68,0.55)",
  critical: "rgba(185,28,28,0.7)",
};

function createPatrolIcon(unitName: string, color: string, isSelected: boolean) {
  return L.divIcon({
    html: `
      <div style="
        width: 34px; height: 34px; border-radius: 50%;
        background: ${color}; border: ${isSelected ? "3px solid #FFFFFF" : "2px solid rgba(255,255,255,0.4)"};
        display: flex; align-items: center; justify-content: center;
        font-family: monospace; font-size: 9px; font-weight: 800;
        color: #FFFFFF; box-shadow: 0 0 ${isSelected ? "18px #FFFFFF" : "10px " + color};
        transition: transform 0.15s ease;
      ">${unitName.split("-")[1]}</div>
    `,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// Auxiliar para mover la cámara al seleccionar una unidad
function MapFocusController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function PatrolSimulator() {
  const [patrols, setPatrols] = useState<PatrolUnit[]>(INITIAL_PATROLS);
  const [selectedPatrolId, setSelectedPatrolId] = useState<string | null>("P-SMP-01");
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [stats, setStats] = useState({
    coverage: 82,
    responseTimeMin: 3.8,
    totalKm: 168.4,
    incidentsPrevented: 14,
  });

  const [focusCenter, setFocusCenter] = useState<[number, number] | null>(null);

  // Motor de simulación en tiempo real (animación continua de patrullas)
  useEffect(() => {
    if (!simRunning) return;

    const interval = setInterval(() => {
      setPatrols((prevPatrols) =>
        prevPatrols.map((p) => {
          const nextProgress = p.progressBetweenPoints + 0.04 * simSpeed;
          if (nextProgress >= 1) {
            const nextIdx = (p.currentPosIndex + 1) % p.waypoints.length;
            return {
              ...p,
              currentPosIndex: nextIdx,
              progressBetweenPoints: 0,
            };
          }
          return {
            ...p,
            progressBetweenPoints: nextProgress,
          };
        })
      );

      setStats((prev) => ({
        coverage: Math.min(96, +(prev.coverage + 0.05 * simSpeed).toFixed(1)),
        responseTimeMin: Math.max(2.5, +(prev.responseTimeMin - 0.01 * simSpeed).toFixed(2)),
        totalKm: +(prev.totalKm + 0.08 * simSpeed).toFixed(1),
        incidentsPrevented: prev.incidentsPrevented + (Math.random() < 0.08 ? 1 : 0),
      }));
    }, 150);

    return () => clearInterval(interval);
  }, [simRunning, simSpeed]);

  function handleReset() {
    setSimRunning(false);
    setPatrols(INITIAL_PATROLS);
    setStats({
      coverage: 82,
      responseTimeMin: 3.8,
      totalKm: 168.4,
      incidentsPrevented: 14,
    });
  }

  function handleSelectPatrol(p: PatrolUnit) {
    setSelectedPatrolId(p.id);
    const curr = getCurrentCoords(p);
    setFocusCenter(curr);
  }

  function getCurrentCoords(p: PatrolUnit): [number, number] {
    const p1 = p.waypoints[p.currentPosIndex];
    const p2 = p.waypoints[(p.currentPosIndex + 1) % p.waypoints.length];
    const lat = p1[0] + (p2[0] - p1[0]) * p.progressBetweenPoints;
    const lng = p1[1] + (p2[1] - p1[1]) * p.progressBetweenPoints;
    return [lat, lng];
  }

  const selectedPatrol = patrols.find((p) => p.id === selectedPatrolId);

  return (
    <div className="flex h-full overflow-hidden bg-[#060D1A] text-white">
      {/* Panel Izquierdo de Control */}
      <div className="w-80 shrink-0 border-r border-white/10 bg-[#0D1728] flex flex-col h-full">
        {/* Cabecera y Controles */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h1 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
              Simulador Táctico de Patrullaje
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSimRunning(!simRunning)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all shadow-lg ${
                simRunning
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {simRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>PAUSAR SIMULACIÓN</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>INICIAR PATRULLAJE</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              title="Reiniciar posiciones"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Selector de velocidad */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-400">
            <span>Velocidad de simulación:</span>
            <div className="flex gap-1">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s as any)}
                  className={`px-2 py-0.5 rounded font-mono font-semibold text-xs ${
                    simSpeed === s
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Unidades de Patrullaje */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase px-1 mb-1">
            Flota Operativa ({patrols.length} Unidades)
          </div>

          {patrols.map((p) => {
            const isSelected = selectedPatrolId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPatrol(p)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-900/30 border-blue-500 shadow-md"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-bold text-xs text-white">{p.unit}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.district}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      p.status === "responding"
                        ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-medium truncate">
                  {p.officer}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {p.coverage}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-blue-400" />
                    {p.speedKmH} km/h
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-400" />
                    {p.batteryPct}% Comb.
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Métricas Operativas en Vivo */}
        <div className="p-3 border-t border-white/10 bg-[#08101E]">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[9px] font-mono text-slate-400 block">
                COBERTURA
              </span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {stats.coverage}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[9px] font-mono text-slate-400 block">
                TIEMPO RESP.
              </span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {stats.responseTimeMin} min
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[9px] font-mono text-slate-400 block">
                RECORRIDO
              </span>
              <span className="text-base font-bold text-blue-400 font-mono">
                {stats.totalKm} km
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[9px] font-mono text-slate-400 block">
                INCID. PREV.
              </span>
              <span className="text-base font-bold text-pink-400 font-mono">
                {stats.incidentsPrevented}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal del Mapa */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={[-12.0464, -77.0428]}
          zoom={13}
          zoomControl={false}
          style={{ width: "100%", height: "100%", background: "#050C18" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />

          <MapFocusController center={focusCenter} />

          {/* Celdas de Riesgo Modeladas */}
          {REAL_CRITICAL_CELLS.map((cell) => (
            <Rectangle
              key={cell.id}
              bounds={[
                [cell.lat, cell.lng],
                [cell.lat + CELL_SIZE, cell.lng + CELL_SIZE],
              ]}
              pathOptions={{
                fillColor: RISK_COLORS[cell.level],
                fillOpacity: 0.65,
                color: RISK_COLORS[cell.level],
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-xs font-sans text-slate-800">
                  <div className="font-bold text-red-600 mb-0.5">{cell.label}</div>
                  <div>Riesgo delictivo predicho: <strong>{(cell.risk * 100).toFixed(0)}%</strong></div>
                  <div>Nivel: <strong className="uppercase">{cell.level}</strong></div>
                </div>
              </Popup>
            </Rectangle>
          ))}

          {/* Rutas de Patrullaje */}
          {patrols.map((p) => (
            <Polyline
              key={p.id}
              positions={[...p.waypoints, p.waypoints[0]]}
              pathOptions={{
                color: p.color,
                weight: selectedPatrolId === p.id ? 4 : 2,
                opacity: selectedPatrolId === p.id ? 0.9 : 0.5,
                dashArray: p.status === "responding" ? "6 6" : undefined,
              }}
            />
          ))}

          {/* Marcadores de Patrullas en Movimiento */}
          {patrols.map((p) => {
            const currentPosition = getCurrentCoords(p);
            const isSelected = selectedPatrolId === p.id;

            return (
              <Marker
                key={p.id}
                position={currentPosition}
                icon={createPatrolIcon(p.unit, p.color, isSelected)}
              >
                <Popup>
                  <div className="text-xs font-sans p-1 min-w-[180px] text-slate-800">
                    <div className="font-bold text-sm text-blue-700 flex items-center justify-between">
                      <span>{p.unit}</span>
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold uppercase">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      {p.officer}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {p.coverage}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[11px] font-mono">
                      <span>Vel: {p.speedKmH} km/h</span>
                      <span>Batería: {p.batteryPct}%</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Panel Flotante de Leyenda y Estado */}
        <div className="absolute top-4 left-4 z-[1000] bg-[#0D1728]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl text-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-wider">
              Control Táctico en Vivo
            </span>
            {simRunning && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SIMULANDO ({simSpeed}x)
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-600/80 inline-block" />
              <span>Zona Crítica Modelada (&gt; 80% riesgo)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500/80 inline-block" />
              <span>Zona de Riesgo Moderado</span>
            </div>
          </div>
        </div>

        {/* Notificación de Simulación en Curso */}
        {simRunning && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold">
              Patrullas optimizando recorridos de prevención delictiva en tiempo real
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
