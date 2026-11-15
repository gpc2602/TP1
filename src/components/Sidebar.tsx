import { useState } from 'react';
import {
  Map, LayoutDashboard, BrainCircuit, Navigation,
  Bell, Settings, Shield, ChevronRight, LogOut,
  Activity, Users
} from 'lucide-react';

export type View = 'map' | 'dashboard' | 'shap' | 'patrol' | 'alerts' | 'settings';

interface SidebarProps {
  activeView: View;
  onViewChange: (v: View) => void;
  alertCount: number;
}

const navItems: { id: View; icon: React.ElementType; label: string }[] = [
  { id: 'map', icon: Map, label: 'Mapa de Calor' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'shap', icon: BrainCircuit, label: 'Análisis IA' },
  { id: 'patrol', icon: Navigation, label: 'Simulador Patrullas' },
  { id: 'alerts', icon: Bell, label: 'Alertas' },
];

export default function Sidebar({ activeView, onViewChange, alertCount }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 shrink-0"
      style={{
        width: expanded ? 224 : 60,
        background: '#0D1B2E',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-3 py-4 cursor-pointer select-none"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: 60 }}
        onClick={() => setExpanded(e => !e)}
      >
        <div
          className="flex items-center justify-center shrink-0 rounded"
          style={{ width: 36, height: 36, background: '#1E3A8A' }}
        >
          <Shield size={18} color="#E8EDF5" />
        </div>
        {expanded && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm leading-tight whitespace-nowrap" style={{ color: '#E8EDF5', fontFamily: 'Inter' }}>
              PredictiSafe
            </div>
            <div className="font-medium text-xs whitespace-nowrap" style={{ color: '#94A3B8' }}>
              Lima Metropolitana
            </div>
          </div>
        )}
        {expanded && (
          <ChevronRight
            size={14}
            style={{ color: '#64748B', marginLeft: 'auto', transform: 'rotate(180deg)', flexShrink: 0 }}
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-1">
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className="flex items-center gap-3 rounded px-2 py-2.5 w-full text-left transition-all duration-150 relative"
              style={{
                background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
                color: active ? '#60A5FA' : '#94A3B8',
                border: active ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <div className="relative shrink-0">
                <Icon size={16} />
                {id === 'alerts' && alertCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-mono font-bold"
                    style={{
                      width: 14, height: 14, fontSize: 9,
                      background: '#DC2626', color: '#fff',
                    }}
                  >
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </div>
              {expanded && (
                <span className="text-xs font-medium whitespace-nowrap">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div
        className="px-2 py-3 flex flex-col gap-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={() => onViewChange('settings')}
          className="flex items-center gap-3 rounded px-2 py-2.5 w-full text-left transition-all"
          style={{
            color: activeView === 'settings' ? '#60A5FA' : '#64748B',
            background: activeView === 'settings' ? 'rgba(37,99,235,0.15)' : 'transparent',
            border: '1px solid transparent',
          }}
        >
          <Settings size={16} />
          {expanded && <span className="text-xs font-medium">Configuración</span>}
        </button>

        {/* User */}
        <div
          className="flex items-center gap-3 rounded px-2 py-2.5 mt-1"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 28, height: 28, background: '#1E3A8A', fontSize: 11, color: '#93C5FD', fontWeight: 600 }}
          >
            CM
          </div>
          {expanded && (
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-semibold whitespace-nowrap" style={{ color: '#E8EDF5' }}>
                Com. Morales
              </div>
              <div className="font-mono" style={{ fontSize: 9, color: '#64748B' }}>
                ADMIN · LIMA
              </div>
            </div>
          )}
          {expanded && (
            <LogOut size={13} style={{ color: '#64748B', flexShrink: 0, marginLeft: 'auto' }} />
          )}
        </div>
      </div>
    </aside>
  );
}
