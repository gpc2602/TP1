import { Bell, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useState } from 'react';

export type AppView = 'map' | 'dashboard' | 'shap' | 'patrol' | 'alerts' | 'settings';

interface TopNavbarProps {
  activeView: AppView;
  onViewChange: (v: AppView) => void;
  onLogout: () => void;
  user: { name: string; role: string };
  alertCount: number;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'map', label: 'Mapas' },
  { id: 'patrol', label: 'Simulador' },
  { id: 'alerts', label: 'Alertas' },
  { id: 'shap', label: 'Reportes' },
  { id: 'settings', label: 'Admin' },
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function TopNavbar({ activeView, onViewChange, onLogout, user, alertCount }: TopNavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className="flex items-center shrink-0 px-5 gap-4"
      style={{
        height: 60,
        background: '#0D1B2E',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0 mr-2">
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 32, height: 32, background: '#1E3A8A' }}
        >
          <Shield size={16} color="#fff" />
        </div>
        <div>
          <span className="font-bold" style={{ fontSize: 13, color: '#E8EDF5', letterSpacing: '-0.01em' }}>
            PredictiSafe
          </span>
          <span style={{ fontSize: 13, color: '#60A5FA', fontWeight: 600 }}> Lima</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', marginRight: 4 }} />

      {/* Nav */}
      <nav className="flex items-center gap-0.5 flex-1">
        {NAV_ITEMS.map(({ id, label }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className="relative rounded px-3 py-1.5 transition-all"
              style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#E8EDF5' : '#64748B',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              {label}
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 2,
                    background: '#2563EB',
                    borderRadius: '2px 2px 0 0',
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: bell + user */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Bell */}
        <button
          onClick={() => onViewChange('alerts')}
          className="relative flex items-center justify-center rounded"
          style={{
            width: 34, height: 34,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: alertCount > 0 ? '#EF4444' : '#64748B',
            cursor: 'pointer',
          }}
        >
          <Bell size={15} />
          {alertCount > 0 && (
            <span
              className="absolute font-bold font-mono"
              style={{
                top: -4, right: -4,
                minWidth: 16, height: 16,
                background: '#DC2626',
                color: '#fff',
                fontSize: 9,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                border: '1.5px solid #0D1B2E',
              }}
            >
              {alertCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2 rounded px-2.5 py-1.5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div
              className="flex items-center justify-center rounded-full font-bold"
              style={{
                width: 28, height: 28,
                background: '#1E3A8A',
                color: '#93C5FD',
                fontSize: 10,
                fontFamily: 'Inter, sans-serif',
                flexShrink: 0,
              }}
            >
              {initials(user.name)}
            </div>
            <div className="hidden sm:block text-left">
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EDF5', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 9, color: '#64748B', whiteSpace: 'nowrap' }}
              >
                {user.role.toUpperCase()}
              </div>
            </div>
            <ChevronDown size={12} color="#64748B" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 rounded overflow-hidden animate-fade-in"
              style={{
                background: '#0D1B2E',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                minWidth: 180,
                zIndex: 200,
              }}
              onMouseLeave={() => setUserMenuOpen(false)}
            >
              <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 12, color: '#E8EDF5', fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                  Sesión activa · expira en 2h
                </div>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); onViewChange('settings'); }}
                className="flex items-center gap-2 w-full px-3 py-2 transition-all"
                style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                Configuración
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); onLogout(); }}
                className="flex items-center gap-2 w-full px-3 py-2 transition-all"
                style={{ fontSize: 12, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
              >
                <LogOut size={12} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
