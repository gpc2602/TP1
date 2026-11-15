import { useState } from 'react';
import {
  LayoutDashboard, Map, Navigation2, Bell, BrainCircuit,
  FileBarChart2, ScrollText, Activity, Settings, Shield,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { AppView, AuthUser } from '../types';

interface MainSidebarProps {
  activeView: AppView;
  onViewChange: (v: AppView) => void;
  onLogout: () => void;
  user: AuthUser;
  alertCount: number;
}

const SECTIONS = [
  {
    label: 'OPERACIONES',
    items: [
      { id: 'dashboard' as AppView, icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'map' as AppView, icon: Map, label: 'Mapa de Calor' },
      { id: 'patrol' as AppView, icon: Navigation2, label: 'Simulador' },
      { id: 'alerts' as AppView, icon: Bell, label: 'Alertas' },
      { id: 'shap' as AppView, icon: BrainCircuit, label: 'Análisis IA' },
    ],
  },
  {
    label: 'GESTIÓN',
    items: [
      { id: 'reports' as AppView, icon: FileBarChart2, label: 'Reportes' },
      { id: 'audit' as AppView, icon: ScrollText, label: 'Logs Auditoría' },
      { id: 'status' as AppView, icon: Activity, label: 'Estado Sistema' },
      { id: 'config' as AppView, icon: Settings, label: 'Configuración' },
    ],
  },
];

const ROLE_COLOR: Record<string, string> = {
  'Administrador': '#DC2626',
  'Supervisor': '#F59E0B',
  'Analista': '#3B82F6',
  'Gestor Serenazgo': '#10B981',
};

export default function MainSidebar({
  activeView, onViewChange, onLogout, user, alertCount,
}: MainSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const W = collapsed ? 60 : 250;

  return (
    <aside
      className="flex flex-col shrink-0 h-full relative transition-all duration-200"
      style={{
        width: W,
        background: '#0D1B2E',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-4 shrink-0"
        style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-center justify-center rounded-lg shrink-0"
          style={{ width: 36, height: 36, background: '#1E3A8A' }}
        >
          <Shield size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              PredictiSafe
            </div>
            <div style={{ fontSize: 9.5, color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
              LIMA · v2.4
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute flex items-center justify-center rounded-full transition-all"
        style={{
          top: 42, right: -12, zIndex: 10,
          width: 24, height: 24,
          background: '#1A2F4E',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#64748B',
          cursor: 'pointer',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {SECTIONS.map(section => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <div
                style={{
                  fontSize: 9, color: '#475569', fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em', paddingLeft: 10, marginBottom: 4,
                }}
              >
                {section.label}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ id, icon: Icon, label }) => {
                const active = activeView === id;
                const isAlerts = id === 'alerts';
                return (
                  <button
                    key={id}
                    onClick={() => onViewChange(id)}
                    title={collapsed ? label : undefined}
                    className="flex items-center rounded-lg transition-all relative"
                    style={{
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? '9px 12px' : '9px 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
                      border: active ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                      color: active ? '#93C5FD' : '#64748B',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                        (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#64748B';
                      }
                    }}
                  >
                    <div className="relative shrink-0">
                      <Icon size={15} />
                      {isAlerts && alertCount > 0 && (
                        <span
                          className="absolute font-mono font-bold flex items-center justify-center rounded-full"
                          style={{
                            top: -5, right: -6,
                            width: 14, height: 14, fontSize: 8,
                            background: '#DC2626', color: '#fff',
                            border: '1px solid #0D1B2E',
                          }}
                        >
                          {alertCount > 9 ? '9+' : alertCount}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {label}
                      </span>
                    )}
                    {!collapsed && active && (
                      <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#3B82F6', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div
        className="px-2 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-center rounded-lg p-2 mb-1"
          style={{
            gap: collapsed ? 0 : 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0 font-bold"
            style={{
              width: 32, height: 32,
              background: `${ROLE_COLOR[user.role] || '#1E3A8A'}20`,
              border: `1px solid ${ROLE_COLOR[user.role] || '#1E3A8A'}40`,
              color: ROLE_COLOR[user.role] || '#93C5FD',
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {user.initials}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div
                style={{
                  fontSize: 9, color: ROLE_COLOR[user.role] || '#64748B',
                  fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
                }}
              >
                {user.role.toUpperCase()}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className="flex items-center rounded-lg transition-all w-full"
          style={{
            gap: 8, padding: '7px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: '#64748B', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={14} />
          {!collapsed && <span style={{ fontSize: 12 }}>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
