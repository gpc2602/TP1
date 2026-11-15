import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, ReferenceLine
} from 'recharts';
import { shapFeatures } from '../data/mockData';
import { BrainCircuit, Info, HelpCircle, ChevronDown } from 'lucide-react';

const districtExamples = [
  { district: 'La Victoria', sector: 'Z-001', risk: 0.87, hour: '23:00', temp: '14°C', patrols: 1 },
  { district: 'Rímac', sector: 'Z-018', risk: 0.79, hour: '01:30', temp: '13°C', patrols: 0 },
  { district: 'Miraflores', sector: 'Z-045', risk: 0.34, hour: '14:00', temp: '19°C', patrols: 4 },
  { district: 'San Isidro', sector: 'Z-062', risk: 0.22, hour: '10:00', temp: '21°C', patrols: 3 },
];

const modelVersions = [
  { version: 'v2.4 (actual)', accuracy: 87.3, f1: 85.1, date: '2024-11-15' },
  { version: 'v2.3', accuracy: 84.1, f1: 82.7, date: '2024-09-02' },
  { version: 'v2.2', accuracy: 81.5, f1: 79.8, date: '2024-06-18' },
  { version: 'v2.1', accuracy: 78.2, f1: 76.4, date: '2024-03-10' },
];

export default function SHAPAnalysis() {
  const [selected, setSelected] = useState(0);
  const selectedExample = districtExamples[selected];

  const positiveFeatures = shapFeatures.filter(f => f.direction === 'positive');
  const negativeFeatures = shapFeatures.filter(f => f.direction === 'negative');

  return (
    <div className="p-5 overflow-y-auto h-full" style={{ background: '#060D1A' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BrainCircuit size={16} color="#60A5FA" />
            <h2 className="font-semibold text-sm" style={{ color: '#E8EDF5' }}>Análisis de Explicabilidad IA (SHAP)</h2>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', maxWidth: 520 }}>
            SHAP (SHapley Additive exPlanations) cuantifica la contribución de cada factor al nivel de riesgo predicho.
            Valores positivos incrementan el riesgo; negativos lo reducen.
          </p>
        </div>
        <div
          className="rounded px-3 py-2 shrink-0"
          style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}
        >
          <div className="font-mono" style={{ fontSize: 9, color: '#64748B' }}>MODELO</div>
          <div className="font-mono font-bold" style={{ fontSize: 13, color: '#60A5FA' }}>XGBoost v2.4</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* SHAP bar chart */}
        <div
          className="lg:col-span-2 rounded p-4"
          style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}>
              VALORES SHAP GLOBALES — TOP 10 FEATURES
            </div>
            <HelpCircle size={12} color="#64748B" />
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={shapFeatures}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis
                type="number"
                domain={[-0.2, 0.35]}
                tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickFormatter={v => v.toFixed(2)}
              />
              <YAxis
                type="category"
                dataKey="feature"
                width={165}
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v: any) => [v.toFixed(3), 'SHAP']}
                contentStyle={{
                  background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6, fontSize: 11, color: '#E8EDF5'
                }}
              />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <Bar
                dataKey="shap"
                name="SHAP"
                radius={[0, 2, 2, 0]}
                fill="#DC2626"
                label={{
                  position: 'right',
                  fontSize: 9,
                  fill: '#94A3B8',
                  fontFamily: 'JetBrains Mono',
                  formatter: (v: any) => typeof v === 'number' ? v.toFixed(3) : '',
                }}
              >
                {shapFeatures.map((entry, i) => (
                  <rect
                    key={i}
                    fill={entry.direction === 'positive' ? '#DC2626' : '#10B981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Color legend */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div style={{ width: 12, height: 8, borderRadius: 2, background: '#DC2626' }} />
              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>Incrementa riesgo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 12, height: 8, borderRadius: 2, background: '#10B981' }} />
              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>Reduce riesgo</span>
            </div>
          </div>
        </div>

        {/* Individual prediction */}
        <div
          className="rounded p-4"
          style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', marginBottom: 12 }}>
            PREDICCIÓN INDIVIDUAL
          </div>

          <div className="flex flex-col gap-1.5 mb-3">
            {districtExamples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left transition-all"
                style={{
                  background: selected === i ? 'rgba(37,99,235,0.18)' : 'rgba(255,255,255,0.03)',
                  border: selected === i ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                }}
              >
                <div
                  className="rounded-full shrink-0"
                  style={{
                    width: 8, height: 8,
                    background: ex.risk > 0.7 ? '#DC2626' : ex.risk > 0.5 ? '#F59E0B' : '#10B981'
                  }}
                />
                <span style={{ fontSize: 11, color: '#E8EDF5', flex: 1 }}>{ex.district}</span>
                <span className="font-mono" style={{ fontSize: 10, color: '#64748B' }}>{ex.sector}</span>
              </button>
            ))}
          </div>

          {/* Risk breakdown */}
          <div
            className="rounded p-3 mb-3"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 11, color: '#94A3B8' }}>Riesgo predicho</span>
              <span
                className="font-mono font-bold"
                style={{
                  fontSize: 22,
                  color: selectedExample.risk > 0.7 ? '#EF4444' : selectedExample.risk > 0.5 ? '#FBBF24' : '#34D399'
                }}
              >
                {Math.round(selectedExample.risk * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Hora', val: selectedExample.hour },
                { label: 'Temperatura', val: selectedExample.temp },
                { label: 'Patrulleros', val: `${selectedExample.patrols} activos` },
                { label: 'Sector', val: selectedExample.sector },
              ].map(({ label, val }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: '#64748B', fontFamily: 'JetBrains Mono' }}>{label.toUpperCase()}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: '#E8EDF5', marginTop: 1 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SHAP waterfall mini */}
          <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono', marginBottom: 8 }}>
            CONTRIBUCIONES LOCALES
          </div>
          {shapFeatures.slice(0, 5).map(f => {
            const adj = f.shap * (selectedExample.risk > 0.6 ? 1.2 : 0.7);
            return (
              <div key={f.feature} className="flex items-center gap-2 mb-1.5">
                <div style={{ flex: 1, fontSize: 9.5, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.feature}
                </div>
                <div style={{ width: 50, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute',
                    height: '100%',
                    width: `${Math.abs(adj) * 150}%`,
                    maxWidth: '100%',
                    background: f.direction === 'positive' ? '#DC2626' : '#10B981',
                    borderRadius: 3,
                    right: f.direction === 'negative' ? 0 : undefined,
                  }} />
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: f.direction === 'positive' ? '#EF4444' : '#34D399', width: 36, textAlign: 'right' }}>
                  {f.direction === 'positive' ? '+' : ''}{adj.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model versions */}
      <div
        className="rounded p-4"
        style={{ background: '#0D1B2E', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em', marginBottom: 12 }}>
          HISTORIAL DE VERSIONES DEL MODELO
        </div>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Versión', 'Precisión', 'F1 Score', 'Fecha Deployment', 'Estado'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontFamily: 'JetBrains Mono', fontSize: 9, color: '#64748B', letterSpacing: '0.06em', fontWeight: 500 }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelVersions.map((v, i) => (
                <tr key={v.version} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', fontSize: 11, color: i === 0 ? '#60A5FA' : '#94A3B8' }}>
                    {v.version}
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', fontSize: 11, color: v.accuracy > 85 ? '#34D399' : '#94A3B8' }}>
                    {v.accuracy}%
                  </td>
                  <td style={{ padding: '8px 12px', fontFamily: 'JetBrains Mono', fontSize: 11, color: '#94A3B8' }}>
                    {v.f1}%
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: '#64748B' }}>{v.date}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      className="font-mono rounded px-2 py-0.5"
                      style={{
                        fontSize: 9,
                        background: i === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                        color: i === 0 ? '#34D399' : '#64748B',
                        border: i === 0 ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                      }}
                    >
                      {i === 0 ? 'PRODUCCIÓN' : 'ARCHIVADO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
