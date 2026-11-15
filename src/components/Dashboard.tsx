import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  ShieldCheck, Users, Navigation, Zap
} from 'lucide-react';
import { districtStats, hourlyData, weeklyTrend, crimeTypes } from '../data/mockData';

const COLORS = ['#DC2626', '#F59E0B', '#3B82F6', '#8B5CF6', '#64748B'];

function StatCard({
  label, value, sub, trend, color, icon: Icon
}: {
  label: string; value: string; sub: string;
  trend?: 'up' | 'down' | 'stable'; color: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded p-4 flex flex-col gap-2"
      style={{
        background: '#0D1B2E',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
          {label}
        </span>
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 26, height: 26, background: `${color}18` }}
        >
          <Icon size={13} color={color} />
        </div>
      </div>
      <div className="font-bold" style={{ fontSize: 26, color: '#E8EDF5', lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
      <div className="flex items-center gap-1.5">
        {trend === 'up' && <TrendingUp size={11} color="#EF4444" />}
        {trend === 'down' && <TrendingDown size={11} color="#10B981" />}
        {trend === 'stable' && <Minus size={11} color="#64748B" />}
        <span style={{ fontSize: 11, color: '#64748B' }}>{sub}</span>
      </div>
    </div>
  );
}

const CustomTooltipDark = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6, padding: '8px 12px', fontSize: 11, color: '#E8EDF5',
    }}>
      <div style={{ color: '#64748B', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#E8EDF5', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const currentHour = new Date().getHours();
  const currentData = hourlyData[currentHour];

  return (
    <div className="p-5 overflow-y-auto h-full" style={{ background: '#060D1A' }}>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="INCIDENTES HOY"
          value="347"
          sub="+12% vs. ayer"
          trend="up"
          color="#DC2626"
          icon={AlertTriangle}
        />
        <StatCard
          label="ZONAS DE ALTO RIESGO"
          value="43"
          sub="Actualizado hace 3 min"
          trend="up"
          color="#F59E0B"
          icon={Zap}
        />
        <StatCard
          label="PATRULLEROS ACTIVOS"
          value="18"
          sub="4 en zona crítica"
          trend="stable"
          color="#2563EB"
          icon={Navigation}
        />
        <StatCard
          label="TASA DE RESOLUCIÓN"
          value="72%"
          sub="+5% vs. semana pasada"
          trend="down"
          color="#10B981"
          icon={ShieldCheck}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Hourly incidents */}
        <div
          className="lg:col-span-2 rounded p-4"
          style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
                INCIDENTES POR HORA — HOY
              </div>
            </div>
            <div
              className="font-mono rounded px-2 py-1"
              style={{ fontSize: 11, background: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.25)' }}
            >
              24h
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltipDark />} />
              <Area
                type="monotone"
                dataKey="incidents"
                name="Incidentes"
                stroke="#DC2626"
                strokeWidth={1.5}
                fill="url(#incidentGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#DC2626' }}
              />
              {/* Current hour marker */}
              <Area
                type="monotone"
                dataKey="risk"
                name="Riesgo"
                stroke="#F59E0B"
                strokeWidth={1}
                fill="none"
                dot={false}
                activeDot={{ r: 3, fill: '#F59E0B' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Crime type pie */}
        <div
          className="rounded p-4"
          style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 16 }}>
            TIPO DE DELITO
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={crimeTypes}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={45}
                strokeWidth={0}
              >
                {crimeTypes.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any, n: any) => [v, n]}
                contentStyle={{
                  background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, fontSize: 11,
                }}
                labelStyle={{ color: '#94A3B8' }}
                itemStyle={{ color: '#E8EDF5' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {crimeTypes.map((c, i) => (
              <div key={c.type} className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#94A3B8', flex: 1 }}>{c.type}</span>
                <span className="font-mono" style={{ fontSize: 10, color: '#64748B' }}>{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Weekly trend */}
        <div
          className="rounded p-4"
          style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 16 }}>
            INCIDENTES VS PREDICCIÓN — SEMANA
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltipDark />} />
              <Bar dataKey="incidents" name="Real" fill="#2563EB" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
              <Bar dataKey="predicted" name="Predicción" fill="#F59E0B" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* District risk table */}
        <div
          className="rounded p-4"
          style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em', marginBottom: 12 }}>
            RANKING DISTRITOS POR RIESGO
          </div>
          <div className="flex flex-col gap-1">
            {districtStats.slice(0, 8).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 py-1">
                <span className="font-mono" style={{ fontSize: 10, color: '#64748B', width: 16 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: 11, color: '#E8EDF5', flex: 1 }}>{d.name}</span>
                <div
                  className="rounded-full"
                  style={{ width: Math.round(d.risk * 60), height: 4, background: d.risk > 0.7 ? '#DC2626' : d.risk > 0.5 ? '#F59E0B' : '#10B981' }}
                />
                <span className="font-mono" style={{ fontSize: 10, color: d.risk > 0.7 ? '#EF4444' : d.risk > 0.5 ? '#FBBF24' : '#34D399', width: 30, textAlign: 'right' }}>
                  {Math.round(d.risk * 100)}%
                </span>
                <span style={{ fontSize: 10, width: 16, textAlign: 'center' }}>
                  {d.trend === 'up' ? '↑' : d.trend === 'down' ? '↓' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model performance */}
      <div
        className="rounded p-4"
        style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
            RENDIMIENTO DEL MODELO PREDICTIVO
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono rounded px-2 py-0.5" style={{ fontSize: 10, background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' }}>
              XGBoost v2.4
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'PRECISIÓN', value: '87.3%', color: '#10B981' },
            { label: 'RECALL', value: '83.1%', color: '#10B981' },
            { label: 'F1 SCORE', value: '85.1%', color: '#10B981' },
            { label: 'AUC-ROC', value: '0.921', color: '#10B981' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="font-mono font-bold" style={{ fontSize: 20, color: m.color }}>{m.value}</div>
              <div className="font-mono" style={{ fontSize: 9, color: '#64748B', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
