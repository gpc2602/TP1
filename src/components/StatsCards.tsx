import { AlertTriangle, BarChart2, CheckCircle, Bell, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface StatsCardsProps {
  onRefresh?: () => void;
  loading?: boolean;
  stats?: {
    criticalCount?: number;
    totalPredictions?: number;
    accuracy?: string;
    alertsCount?: number;
  };
}

const CARDS = [
  {
    id: 'critical',
    label: 'Zonas Críticas Activas',
    value: 12,
    change: '+3 vs ayer',
    direction: 'up' as const,
    icon: AlertTriangle,
    color: '#DC2626',
    bgColor: 'rgba(220,38,38,0.08)',
    borderColor: 'rgba(220,38,38,0.2)',
  },
  {
    id: 'predictions',
    label: 'Predicciones Hoy',
    value: 847,
    change: '+64 vs ayer',
    direction: 'up' as const,
    icon: BarChart2,
    color: '#2563EB',
    bgColor: 'rgba(37,99,235,0.08)',
    borderColor: 'rgba(37,99,235,0.2)',
  },
  {
    id: 'accuracy',
    label: 'Precisión del Modelo',
    value: '84.3%',
    change: '+1.2% vs semana',
    direction: 'up' as const,
    icon: CheckCircle,
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.2)',
  },
  {
    id: 'alerts',
    label: 'Alertas Emitidas',
    value: 7,
    change: '-2 vs ayer',
    direction: 'down' as const,
    icon: Bell,
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
  },
];

function Skeleton() {
  return (
    <div
      className="rounded-lg p-4 animate-pulse"
      style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)', flex: 1 }}
    >
      <div style={{ height: 10, width: 100, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ height: 26, width: 60, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 9, width: 80, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }} />
    </div>
  );
}

export default function StatsCards({ onRefresh, loading, stats }: StatsCardsProps) {
  const now = new Date();
  const timeStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

  const cardsToRender = CARDS.map(card => {
    if (!stats) return card;
    if (card.id === 'critical' && stats.criticalCount !== undefined) {
      return { ...card, value: stats.criticalCount };
    }
    if (card.id === 'predictions' && stats.totalPredictions !== undefined) {
      return { ...card, value: stats.totalPredictions };
    }
    if (card.id === 'accuracy' && stats.accuracy !== undefined) {
      return { ...card, value: stats.accuracy };
    }
    if (card.id === 'alerts' && stats.alertsCount !== undefined) {
      return { ...card, value: stats.alertsCount };
    }
    return card;
  });

  return (
    <div
      className="flex items-center gap-0 shrink-0 px-4 py-3"
      style={{
        background: '#0A1628',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} />)
          : cardsToRender.map(card => {
              const Icon = card.icon;
              const isNumericUp = card.direction === 'up' && card.id !== 'accuracy' && card.id !== 'alerts';
              return (
                <div
                  key={card.id}
                  className="rounded-lg p-4 transition-all"
                  style={{
                    background: '#0D1B2E',
                    border: `1px solid ${card.borderColor}`,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#112240'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0D1B2E'}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.3, maxWidth: 110 }}>
                      {card.label}
                    </span>
                    <div
                      className="flex items-center justify-center rounded-lg shrink-0"
                      style={{ width: 30, height: 30, background: card.bgColor }}
                    >
                      <Icon size={14} color={card.color} />
                    </div>
                  </div>
                  <div
                    className="font-bold"
                    style={{
                      fontSize: 26,
                      color: card.color,
                      lineHeight: 1,
                      fontFamily: 'JetBrains Mono, monospace',
                      marginBottom: 6,
                    }}
                  >
                    {card.value}
                  </div>
                  <div className="flex items-center gap-1">
                    {card.direction === 'up'
                      ? <TrendingUp size={10} color={card.id === 'accuracy' || card.id === 'predictions' ? '#10B981' : '#EF4444'} />
                      : <TrendingDown size={10} color="#10B981" />}
                    <span style={{ fontSize: 10, color: '#64748B' }}>{card.change}</span>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Time + refresh */}
      <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 transition-all"
          style={{
            background: 'rgba(37,99,235,0.12)',
            border: '1px solid rgba(37,99,235,0.25)',
            color: '#60A5FA',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(37,99,235,0.12)'}
        >
          <RefreshCw size={11} />
          Actualizar Predicciones
        </button>
        <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
          Actualizado: {timeStr}
        </div>
      </div>
    </div>
  );
}
