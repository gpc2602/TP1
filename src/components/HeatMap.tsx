import { useState } from 'react';
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet';
import { generateHeatGrid, type GridCell } from '../data/mockData';
import { ZoomIn, ZoomOut, Layers, Filter, Maximize2 } from 'lucide-react';

const RISK_COLORS: Record<string, string> = {
  low: 'rgba(59,130,246,0.45)',
  'med-low': 'rgba(16,185,129,0.45)',
  medium: 'rgba(234,179,8,0.52)',
  'med-high': 'rgba(249,115,22,0.58)',
  high: 'rgba(239,68,68,0.62)',
  critical: 'rgba(220,38,38,0.78)',
};

const RISK_BORDER: Record<string, string> = {
  low: 'rgba(59,130,246,0.65)',
  'med-low': 'rgba(16,185,129,0.65)',
  medium: 'rgba(234,179,8,0.75)',
  'med-high': 'rgba(249,115,22,0.85)',
  high: 'rgba(239,68,68,0.9)',
  critical: 'rgba(220,38,38,1)',
};

const RISK_LABELS: Record<string, string> = {
  low: 'Bajo (0–30%)',
  'med-low': 'Bajo-Medio',
  medium: 'Medio (31–60%)',
  'med-high': 'Medio-Alto',
  high: 'Alto (61–100%)',
  critical: 'Crítico',
};

const RISK_ICON: Record<string, string> = {
  low: '🔵', 'med-low': '🟢', medium: '🟡', 'med-high': '🟠', high: '🔴', critical: '🔴',
};

const CELL_SIZE = 0.0045;

interface HeatMapProps {
  onCellClick?: (cell: GridCell) => void;
  filterLevel?: string;
  cells?: GridCell[];
  isLive?: boolean;
  loading?: boolean;
}

function ZoomController() {
  const map = useMap();
  return (
    <div className="absolute bottom-10 right-4 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={() => map.zoomIn()}
        className="flex items-center justify-center rounded"
        style={{
          width: 32, height: 32, background: '#0D1B2E',
          border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer',
        }}
        title="Acercar"
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="flex items-center justify-center rounded"
        style={{
          width: 32, height: 32, background: '#0D1B2E',
          border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer',
        }}
        title="Alejar"
      >
        <ZoomOut size={14} />
      </button>
      <button
        onClick={() => map.setView([-12.05, -77.04], 13)}
        className="flex items-center justify-center rounded"
        style={{
          width: 32, height: 32, background: '#0D1B2E',
          border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', cursor: 'pointer',
        }}
        title="Vista completa"
      >
        <Maximize2 size={12} />
      </button>
    </div>
  );
}

export default function HeatMap({
  onCellClick,
  filterLevel = 'all',
  cells: externalCells,
  isLive = true,
  loading: externalLoading = false,
}: HeatMapProps) {
  const [defaultCells] = useState<GridCell[]>(() => generateHeatGrid());
  const [showLegend, setShowLegend] = useState(true);
  const [localFilter, setLocalFilter] = useState('all');

  const cells = externalCells && externalCells.length > 0 ? externalCells : defaultCells;
  const loading = externalLoading;

  const activeFilter = filterLevel !== 'all' ? filterLevel : localFilter;

  const visibleCells = activeFilter === 'all'
    ? cells
    : cells.filter(c => c.level === activeFilter);

  const highRiskCount = cells.filter(c => c.level === 'high' || c.level === 'critical').length;

  return (
    <div className="relative w-full h-full" style={{ background: '#060D1A' }}>
      {loading && (
        <div
          className="absolute inset-0 z-[2000] flex items-center justify-center"
          style={{ background: 'rgba(6,13,26,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div style={{
              width: 36, height: 36, border: '2px solid rgba(37,99,235,0.2)',
              borderTop: '2px solid #2563EB', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span className="font-mono text-xs" style={{ color: '#60A5FA' }}>
              ACTUALIZANDO PREDICCIONES...
            </span>
          </div>
        </div>
      )}

      <MapContainer
        center={[-12.05, -77.04]}
        zoom={12}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        />

        {visibleCells.map(cell => {
          const isDistrict = Boolean((cell as any).isDistrict);
          const half = isDistrict ? 0.009 : CELL_SIZE / 2;
          const bounds: [[number, number], [number, number]] = isDistrict
            ? [
                [cell.lat - half, cell.lng - half],
                [cell.lat + half, cell.lng + half],
              ]
            : [
                [cell.lat, cell.lng],
                [cell.lat + CELL_SIZE, cell.lng + CELL_SIZE],
              ];

          return (
            <Rectangle
              key={cell.id}
              bounds={bounds}
              pathOptions={{
                fillColor: RISK_COLORS[cell.level] || 'rgba(59,130,246,0.45)',
                fillOpacity: 0.82,
                color: RISK_BORDER[cell.level] || 'rgba(59,130,246,0.65)',
                weight: 1.2,
                opacity: 0.8,
              }}
              eventHandlers={{
                click: () => onCellClick?.(cell),
                mouseover: e => {
                  e.target.setStyle({ weight: 2.8, fillOpacity: 0.95, opacity: 1 });
                  e.target.bringToFront();
                  (e.target as any).getElement?.()?.style && ((e.target as any).getElement().style.cursor = 'pointer');
                },
                mouseout: e => {
                  e.target.setStyle({ weight: 1.2, fillOpacity: 0.82, opacity: 0.8 });
                },
              }}
            />
          );
        })}

        <ZoomController />
      </MapContainer>

      {/* Top info bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <div
          className="flex items-center gap-3 rounded px-3 py-2 pointer-events-auto"
          style={{
            background: 'rgba(13,27,46,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full animate-pulse-danger"
              style={{ width: 7, height: 7, background: isLive ? '#10B981' : '#F59E0B' }}
            />
            <span className="font-mono" style={{ fontSize: 10, color: isLive ? '#34D399' : '#FBBF24' }}>
              {isLive ? 'MODELO ML ACTIVO' : 'MODO SIMULADO'}
            </span>
          </div>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
          <span className="font-mono" style={{ fontSize: 10, color: '#EF4444', fontWeight: 600 }}>
            {highRiskCount} zonas críticas
          </span>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
          <span className="font-mono" style={{ fontSize: 10, color: '#64748B' }}>
            {visibleCells.length} distritos analizados
          </span>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
          <span className="font-mono" style={{ fontSize: 10, color: '#64748B' }}>Random Forest Lima · 84.6% R²</span>
        </div>

        <div className="flex-1" />

        {/* Filter pills */}
        <div
          className="flex items-center gap-1 rounded px-2 py-1.5 pointer-events-auto"
          style={{
            background: 'rgba(13,27,46,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Filter size={11} style={{ color: '#64748B', marginRight: 4 }} />
          {['all', 'critical', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setLocalFilter(f)}
              className="rounded px-2 py-0.5 font-mono transition-all"
              style={{
                fontSize: 10,
                background: activeFilter === f ? 'rgba(37,99,235,0.3)' : 'transparent',
                color: activeFilter === f ? '#93C5FD' : '#64748B',
                border: activeFilter === f ? '1px solid rgba(37,99,235,0.4)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'TODOS' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowLegend(s => !s)}
          className="flex items-center justify-center rounded pointer-events-auto"
          style={{
            width: 32, height: 32,
            background: 'rgba(13,27,46,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: showLegend ? '#60A5FA' : '#64748B',
            cursor: 'pointer',
          }}
          title="Leyenda"
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Click hint */}
      <div
        className="absolute bottom-14 left-1/2 z-[1000] pointer-events-none"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div
          className="rounded px-3 py-1.5"
          style={{
            background: 'rgba(13,27,46,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
            Haga clic en una celda para ver el detalle
          </span>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div
          className="absolute bottom-14 right-14 z-[1000] rounded"
          style={{
            background: 'rgba(13,27,46,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            padding: '10px 12px',
          }}
        >
          <div className="font-mono" style={{ fontSize: 9, color: '#64748B', marginBottom: 8, letterSpacing: '0.06em' }}>
            NIVEL DE RIESGO
          </div>
          {(['low', 'medium', 'high'] as const).map(key => (
            <div key={key} className="flex items-center gap-2 mb-1.5">
              <span style={{ fontSize: 12, lineHeight: 1 }}>{RISK_ICON[key]}</span>
              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                {RISK_LABELS[key]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
