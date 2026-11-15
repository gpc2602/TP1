import { X, MapPin, Clock, Target, TrendingUp, AlertTriangle, Navigation, History, Send } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { GridCell } from '../data/mockData';

interface CellDetailModalProps {
  cell: GridCell;
  onClose: () => void;
  onSimulatePatrol?: () => void;
}

const RISK_LEVEL_LABEL: Record<string, string> = {
  low: 'BAJO', 'med-low': 'BAJO-MEDIO', medium: 'MEDIO',
  'med-high': 'MEDIO-ALTO', high: 'ALTO', critical: 'CRÍTICO',
};

const RISK_LEVEL_COLOR: Record<string, string> = {
  low: '#3B82F6', 'med-low': '#10B981', medium: '#F59E0B',
  'med-high': '#F97316', high: '#EF4444', critical: '#DC2626',
};

const DISTRICT_STREETS: Record<string, string> = {
  'Miraflores': 'Av. Larco con Av. Diagonal',
  'San Isidro': 'Av. Javier Prado Oeste con Av. Paseo de la República',
  'La Victoria': 'Av. Grau con Jr. Huánuco',
  'Rímac': 'Jr. Trujillo con Av. Prolongación Tacna',
  'Breña': 'Av. Brasil con Jr. Huaraz',
  'Surquillo': 'Av. Angamos con Av. Tomás Marsano',
  'Chorrillos': 'Av. Defensores del Morro con Av. Guardia Civil',
  'San Miguel': 'Av. La Marina con Av. Universitaria',
  'El Agustino': 'Av. José Carlos Mariátegui con Av. Grau',
  'Lince': 'Av. Petit Thouars con Av. Arequipa',
  'San Borja': 'Av. San Luis con Av. Angamos Este',
  'La Molina': 'Av. La Molina con Av. Raúl Ferrero',
  'SJL': 'Av. Próceres de la Independencia con Av. Los Postes',
  'Los Olivos': 'Av. Universitaria con Av. Tomas Valle',
  'Independencia': 'Av. Túpac Amaru con Av. Los Jardines',
  'Comas': 'Av. Tupac Amaru con Av. Universitaria Norte',
  'Carabayllo': 'Av. Universitaria Norte con Calle 9',
  'Puente Piedra': 'Panamericana Norte con Av. Las Vegas',
  'Cercado': 'Jr. de la Unión con Av. Abancay',
  'Surco': 'Av. Primavera con Av. El Polo',
};

const CRIME_TYPE_BY_RISK: Record<string, string> = {
  low: 'Vandalismo menor', 'med-low': 'Hurto simple',
  medium: 'Arrebato', 'med-high': 'Robo a transeúnte',
  high: 'Robo a mano armada', critical: 'Asalto y robo agravado',
};

const SHAP_BASE = [
  { name: 'Hora nocturna', value: 0.35 },
  { name: 'Baja iluminación', value: 0.28 },
  { name: 'Alta densidad pob.', value: 0.20 },
  { name: 'Dist. comisaría', value: 0.17 },
  { name: 'Día semana', value: 0.12 },
];

function getCellCode(cell: GridCell): string {
  const latIdx = Math.floor(Math.abs(cell.lat + 12.2) / 0.0045) % 26;
  const lngIdx = Math.floor(Math.abs(cell.lng + 77.2) / 0.0045) % 99;
  return `${String.fromCharCode(65 + latIdx)}${lngIdx + 1}`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#E8EDF5',
    }}>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#EF4444' }}>
        +{payload[0].value.toFixed(2)}
      </span>
    </div>
  );
};

export default function CellDetailModal({ cell, onClose, onSimulatePatrol }: CellDetailModalProps) {
  const riskPct = Math.round(cell.risk * 100);
  const riskColor = RISK_LEVEL_COLOR[cell.level];
  const cellCode = getCellCode(cell);
  const streetName = DISTRICT_STREETS[cell.district] || `Av. Principal con Jr. Secundaria, ${cell.district}`;
  const crimeType = CRIME_TYPE_BY_RISK[cell.level];
  const trendPct = Math.round(cell.risk * 18 + 4);

  const shapData = SHAP_BASE.map(s => ({
    ...s,
    value: parseFloat((s.value * (0.7 + cell.risk * 0.6)).toFixed(2)),
  }));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-xl overflow-hidden animate-fade-in"
        style={{
          width: 600,
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: '#0D1B2E',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-bold" style={{ fontSize: 15, color: '#E8EDF5' }}>
                Detalle de Zona de Riesgo
              </h2>
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
              Cuadrícula #{cellCode} · {cell.district} · 500×500m
            </div>
          </div>

          {/* Risk badge */}
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 shrink-0"
            style={{
              background: `${riskColor}18`,
              border: `1px solid ${riskColor}40`,
            }}
          >
            <div className="rounded-full" style={{ width: 8, height: 8, background: riskColor, boxShadow: `0 0 6px ${riskColor}` }} />
            <span className="font-bold font-mono" style={{ fontSize: 13, color: riskColor }}>
              {riskPct}% {RISK_LEVEL_LABEL[cell.level]}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-all"
            style={{
              width: 30, height: 30,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748B',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#E8EDF5'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Left column 60% */}
          <div
            className="flex-1 p-5 overflow-y-auto"
            style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', marginBottom: 14 }}>
              INFORMACIÓN GENERAL
            </div>

            <div className="flex flex-col gap-4">
              {/* Location */}
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded shrink-0 mt-0.5"
                  style={{ width: 28, height: 28, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
                >
                  <MapPin size={13} color="#60A5FA" />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Ubicación</div>
                  <div style={{ fontSize: 12, color: '#E8EDF5', lineHeight: 1.4 }}>
                    {streetName}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 1, fontFamily: 'JetBrains Mono, monospace' }}>
                    {cell.lat.toFixed(4)}, {cell.lng.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded shrink-0 mt-0.5"
                  style={{ width: 28, height: 28, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <Clock size={13} color="#FBBF24" />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Franja Horaria de Mayor Riesgo</div>
                  <div style={{ fontSize: 12, color: '#E8EDF5' }}>
                    {cell.risk > 0.65 ? '20:00 – 02:00' : cell.risk > 0.4 ? '18:00 – 22:00' : '07:00 – 09:00'}
                  </div>
                </div>
              </div>

              {/* Crime type */}
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded shrink-0 mt-0.5"
                  style={{ width: 28, height: 28, background: `${riskColor}12`, border: `1px solid ${riskColor}25` }}
                >
                  <Target size={13} color={riskColor} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Tipo de Delito Predominante</div>
                  <div style={{ fontSize: 12, color: '#E8EDF5' }}>{crimeType}</div>
                </div>
              </div>

              {/* Probability */}
              <div
                className="rounded-lg p-4"
                style={{ background: `${riskColor}08`, border: `1px solid ${riskColor}20` }}
              >
                <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>Probabilidad de Incidente</div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold" style={{ fontSize: 38, color: riskColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                    {riskPct}%
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>probabilidad</span>
                </div>
                <div style={{ marginTop: 8, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${riskPct}%`, height: '100%', background: riskColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              {/* Trend + Active alerts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <TrendingUp size={14} color="#EF4444" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Tendencia</div>
                    <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                      ↑ {trendPct}% vs sem. anterior
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Alertas Activas</div>
                    <div style={{ fontSize: 12, color: '#FBBF24', fontWeight: 600 }}>
                      {cell.incidents > 20 ? 3 : cell.incidents > 10 ? 2 : 1} en últimas 24h
                    </div>
                  </div>
                </div>
              </div>

              {/* Incidents */}
              <div style={{ fontSize: 11, color: '#64748B', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: '#E8EDF5', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{cell.incidents}</span>
                {' '}incidentes registrados en los últimos 30 días en esta zona
              </div>
            </div>
          </div>

          {/* Right column 40% */}
          <div className="p-5 overflow-y-auto" style={{ width: 220, flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', marginBottom: 14 }}>
              FACTORES DE RIESGO (SHAP)
            </div>

            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 0.5]}
                  tick={{ fontSize: 8, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickFormatter={v => `+${v.toFixed(1)}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 9.5, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 2, 2, 0]} maxBarSize={14}>
                  {shapData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.value > 0.3 ? '#DC2626'
                          : entry.value > 0.2 ? '#EF4444'
                          : entry.value > 0.15 ? '#F97316'
                          : '#F59E0B'
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* SHAP values list */}
            <div className="flex flex-col gap-2 mt-2">
              {shapData.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ fontSize: 9.5, color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </span>
                  <span
                    className="font-mono font-semibold"
                    style={{ fontSize: 10, color: '#EF4444', flexShrink: 0 }}
                  >
                    +{s.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Compliance note */}
            <div
              className="rounded-lg px-3 py-2.5 mt-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ fontSize: 9, color: '#64748B', lineHeight: 1.5 }}>
                Cumple <span style={{ color: '#60A5FA' }}>Ley N° 31814</span> —
                IA Explicable. Factores SHAP auditables por la ciudadanía.
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center gap-2 px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#94A3B8',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#E8EDF5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
          >
            <History size={13} /> Ver Historial
          </button>

          <button
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 transition-all"
            style={{
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#EF4444',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.2)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.12)'}
          >
            <Send size={13} /> Enviar Alerta
          </button>

          <button
            onClick={() => { onClose(); onSimulatePatrol?.(); }}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 transition-all ml-auto"
            style={{
              background: '#1E3A8A',
              border: '1px solid rgba(37,99,235,0.4)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2563EB'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1E3A8A'}
          >
            <Navigation size={13} /> Simular Patrullaje
          </button>
        </div>
      </div>
    </div>
  );
}
