import { Bell, Wifi, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  alertCount: number;
  onAlertsClick: () => void;
}

export default function TopBar({ title, subtitle, alertCount, onAlertsClick }: TopBarProps) {
  const [time, setTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const timeStr = time.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <header
      className="flex items-center gap-4 px-5"
      style={{
        height: 56,
        background: '#0D1B2E',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold truncate" style={{ color: '#E8EDF5' }}>{title}</h1>
          {subtitle && (
            <span className="text-xs hidden sm:block" style={{ color: '#64748B' }}>{subtitle}</span>
          )}
        </div>
      </div>

      {/* Status indicators */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className="rounded-full animate-pulse-danger"
            style={{ width: 7, height: 7, background: '#10B981' }}
          />
          <span className="font-mono text-xs" style={{ color: '#10B981' }}>EN VIVO</span>
        </div>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />

        {/* Wifi */}
        <div className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
          <Wifi size={13} />
          <span className="font-mono text-xs">98.4%</span>
        </div>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)' }} />

        {/* Clock */}
        <div className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
          <Clock size={13} />
          <span className="font-mono text-xs">{timeStr}</span>
          <span className="text-xs" style={{ color: '#64748B' }}>{dateStr}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center rounded transition-all"
          style={{
            width: 30, height: 30,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94A3B8',
          }}
          title="Actualizar datos"
        >
          <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
        </button>

        <button
          onClick={onAlertsClick}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 transition-all relative"
          style={{
            background: alertCount > 0 ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.04)',
            border: alertCount > 0 ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(255,255,255,0.08)',
            color: alertCount > 0 ? '#EF4444' : '#94A3B8',
          }}
        >
          {alertCount > 0 ? <AlertTriangle size={13} /> : <Bell size={13} />}
          {alertCount > 0 && (
            <span className="font-mono text-xs font-semibold">{alertCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}

// Add spin keyframe
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
