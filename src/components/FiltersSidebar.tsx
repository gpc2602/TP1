import { useState } from 'react';
import { Filter, X, ChevronDown, Calendar, Clock, MapPin } from 'lucide-react';

interface FiltersState {
  dateFrom: string;
  dateTo: string;
  crimeType: string;
  timeSlots: number[];
  district: string;
}

interface FiltersSidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  onApply: (f: FiltersState) => void;
}

const CRIME_TYPES = [
  { value: 'ROBO', label: 'Robo' },
  { value: 'HURTO', label: 'Hurto' },
  { value: 'ESTAFA', label: 'Estafa' },
  { value: 'EXTORSIÓN', label: 'Extorsión' },
  { value: 'VIOLENCIA CONTRA LA MUJER E INTEGRANTES', label: 'Violencia Familiar / Género' },
  { value: 'SECUESTRO', label: 'Secuestro' },
  { value: 'OTROS', label: 'Otros delitos' },
];

const TIME_SLOTS = [
  { id: 0, label: '00:00–04:00' },
  { id: 1, label: '04:00–08:00' },
  { id: 2, label: '08:00–12:00' },
  { id: 3, label: '12:00–16:00' },
  { id: 4, label: '16:00–20:00' },
  { id: 5, label: '20:00–24:00' },
];

const DISTRICTS = [
  'Todos los distritos',
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
  'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina',
  'La Victoria', 'Lima', 'Lince', 'Los Olivos', 'Lurigancho', 'Lurín',
  'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre',
  'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo',
  'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
  'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita',
  'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo',
  'Villa El Salvador', 'Villa María del Triunfo'
];

function today() {
  return new Date().toISOString().split('T')[0];
}

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export default function FiltersSidebar({ collapsed, onCollapse, onApply }: FiltersSidebarProps) {
  const [filters, setFilters] = useState<FiltersState>({
    dateFrom: sevenDaysAgo(),
    dateTo: today(),
    crimeType: 'ROBO',
    timeSlots: [4, 5],
    district: 'Todos los distritos',
  });

  const toggleSlot = (id: number) => {
    setFilters(f => ({
      ...f,
      timeSlots: f.timeSlots.includes(id) ? f.timeSlots.filter(s => s !== id) : [...f.timeSlots, id],
    }));
  };

  const handleClear = () => {
    setFilters({
      dateFrom: sevenDaysAgo(),
      dateTo: today(),
      crimeType: 'ROBO',
      timeSlots: [],
      district: 'Todos los distritos',
    });
  };

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center py-4 shrink-0"
        style={{ width: 44, background: '#0D1B2E', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={() => onCollapse(false)}
          className="flex items-center justify-center rounded p-2 transition-all"
          style={{ color: '#64748B', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Abrir filtros"
        >
          <Filter size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 280,
        background: '#0D1B2E',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <Filter size={13} color="#60A5FA" />
          <span className="font-semibold" style={{ fontSize: 12, color: '#E8EDF5' }}>
            Filtros de Análisis
          </span>
        </div>
        <button
          onClick={() => onCollapse(true)}
          style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {/* Date range */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar size={11} color="#64748B" />
            <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
              RANGO DE FECHAS
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>Desde</div>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: 12,
                  background: '#112240',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#E8EDF5',
                  outline: 'none',
                  fontFamily: 'JetBrains Mono, monospace',
                  colorScheme: 'dark',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>Hasta</div>
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: 12,
                  background: '#112240',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  color: '#E8EDF5',
                  outline: 'none',
                  fontFamily: 'JetBrains Mono, monospace',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </div>
        </div>

        {/* Crime type */}
        <div>
          <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', marginBottom: 8 }}>
            TIPO DE DELITO
          </div>
          <div className="relative">
            <select
              value={filters.crimeType}
              onChange={e => setFilters(f => ({ ...f, crimeType: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 32px 8px 10px',
                fontSize: 12,
                background: '#112240',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#E8EDF5',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {CRIME_TYPES.map(c => (
                <option key={c.value} value={c.value} style={{ background: '#112240' }}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Time slots */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={11} color="#64748B" />
            <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
              FRANJA HORARIA
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_SLOTS.map(slot => {
              const active = filters.timeSlots.includes(slot.id);
              return (
                <button
                  key={slot.id}
                  onClick={() => toggleSlot(slot.id)}
                  style={{
                    padding: '6px 4px',
                    fontSize: 10,
                    background: active ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.03)',
                    border: active ? '1px solid rgba(37,99,235,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 6,
                    color: active ? '#93C5FD' : '#64748B',
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.15s',
                    textAlign: 'center',
                  }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
          {filters.timeSlots.length > 0 && (
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>
              {filters.timeSlots.length} franja{filters.timeSlots.length > 1 ? 's' : ''} seleccionada{filters.timeSlots.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* District */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin size={11} color="#64748B" />
            <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
              DISTRITO
            </span>
          </div>
          <div className="relative">
            <select
              value={filters.district}
              onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 32px 8px 10px',
                fontSize: 12,
                background: '#112240',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#E8EDF5',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {DISTRICTS.map(d => (
                <option key={d} value={d} style={{ background: '#112240' }}>{d}</option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => onApply(filters)}
          style={{
            width: '100%',
            padding: '9px 0',
            fontSize: 13,
            fontWeight: 600,
            background: '#1E3A8A',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#2563EB'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1E3A8A'}
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClear}
          style={{
            width: '100%',
            padding: '7px 0',
            fontSize: 12,
            background: 'none',
            color: '#64748B',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            textDecoration: 'underline',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}
