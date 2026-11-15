import { useState, useMemo } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Info, ChevronDown } from 'lucide-react';
import type { AuthUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

function sr(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function riskToColor(r: number) {
  if (r < 0.25) return '#1D4ED8';
  if (r < 0.45) return '#2563EB';
  if (r < 0.6) return '#10B981';
  if (r < 0.72) return '#F59E0B';
  if (r < 0.85) return '#F97316';
  return '#DC2626';
}

function getStrength(pw: string) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: 'Débil', color: '#DC2626' };
  if (s === 2) return { score: s, label: 'Regular', color: '#F59E0B' };
  if (s === 3) return { score: s, label: 'Buena', color: '#3B82F6' };
  return { score: s, label: 'Fuerte', color: '#10B981' };
}

const ROLES = ['Gestor Serenazgo', 'Supervisor', 'Administrador', 'Analista'];

const DEMO_USERS: Record<string, AuthUser & { password: string }> = {
  'gabriel.perkovic@munismp.gob.pe': {
    email: 'gabriel.perkovic@munismp.gob.pe',
    password: 'SecureGov2026!',
    name: 'Gabriel Perkovic',
    role: 'Gestor Serenazgo',
    initials: 'GP',
  },
  'admin@predictiSafe.gob.pe': {
    email: 'admin@predictiSafe.gob.pe',
    password: 'Admin2026!',
    name: 'Com. César Morales',
    role: 'Administrador',
    initials: 'CM',
  },
  'diana.ponce@munilima.gob.pe': {
    email: 'diana.ponce@munilima.gob.pe',
    password: 'Supervisor2026!',
    name: 'Diana Ponce',
    role: 'Supervisor',
    initials: 'DP',
  },
};

const MOCK_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJncGVya292aWMiLCJyb2xlIjoiR2VzdG9yIiwiZGlzdCI6IlNNUCIsImV4cCI6MTcyNzIyNTIwMH0.' +
  'xK9mR2vTpQs7dWnZfHgBcYeAJuLiVoNkPlTrMsXwUq4';

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('gabriel.perkovic@munismp.gob.pe');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState('Gestor Serenazgo');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [successUser, setSuccessUser] = useState<AuthUser | null>(null);
  const [jwtRevealed, setJwtRevealed] = useState(false);

  const strength = getStrength(password);

  const heatCells = useMemo(() => {
    const hotspots: [number, number, number][] = [[8, 10, 0.9], [14, 6, 0.82], [20, 15, 0.87], [5, 17, 0.71], [24, 8, 0.76]];
    return Array.from({ length: 28 * 22 }, (_, i) => {
      const row = Math.floor(i / 22), col = i % 22;
      let r = sr(i * 5.3) * 0.28;
      for (const [hr, hc, hi] of hotspots) {
        const d = Math.sqrt((row - hr) ** 2 + (col - hc) ** 2);
        r = Math.max(r, hi * Math.exp(-d * 0.32));
      }
      return { row, col, risk: Math.min(1, r + sr(i * 2.1) * 0.07) };
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('Ingrese un correo electrónico válido.'); return; }
    if (password.length < 4) { setError('Contraseña demasiado corta.'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const match = DEMO_USERS[email];
      if (match && match.password === password) {
        const u: AuthUser = { name: match.name, role, email: match.email, initials: match.initials };
        setSuccessUser(u);
        setTimeout(() => onLogin(u), 2000);
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(`Credenciales inválidas. Intento ${next} de 3.`);
      }
    }, 900);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif', background: '#0F172A' }}>
      {/* ── Left 40% ── */}
      <div
        className="relative hidden md:flex flex-col justify-between overflow-hidden shrink-0"
        style={{ width: '40%', background: 'linear-gradient(155deg, #1E3A8A 0%, #0F172A 100%)' }}
      >
        {/* Heat map SVG */}
        <svg viewBox="0 0 220 280" preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.17 }}>
          {heatCells.map(({ row, col, risk }, i) => (
            <rect key={i} x={col * 10 + 0.5} y={row * 10 + 0.5} width={9} height={9}
              fill={riskToColor(risk)} rx={1} />
          ))}
        </svg>
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.055 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <line key={`v${i}`} x1={i * 20} y1={0} x2={i * 20} y2={700} stroke="#fff" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 20} x2={400} y2={i * 20} stroke="#fff" strokeWidth={0.5} />
          ))}
        </svg>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(30,58,138,0.55) 0%, transparent 30%, transparent 65%, rgba(15,23,42,0.85) 100%)' }} />

        {/* Branding */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Shield size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>PredictiSafe Lima</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                SISTEMA PREDICTIVO DE SEGURIDAD CIUDADANA
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.25, maxWidth: 310, marginBottom: 12 }}>
            Predictive Analytics para Seguridad Ciudadana
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', maxWidth: 300, lineHeight: 1.75 }}>
            Plataforma de predicción ML para gestión proactiva de incidentes en Lima Metropolitana.
          </p>

          <div className="flex items-center gap-2 mt-8">
            {['#3B82F6', '#10B981', '#F59E0B', '#F97316', '#DC2626'].map((c, i) => (
              <div key={i} style={{ flex: 1, height: 6, background: c, borderRadius: 3, opacity: 0.85 }} />
            ))}
            <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 6, whiteSpace: 'nowrap' }}>
              BAJO → CRÍTICO
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 px-10">
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: '24', sub: 'Distritos cubiertos' },
              { val: '87%', sub: 'Precisión modelo' },
              { val: '500m²', sub: 'Resolución de celda' },
              { val: '15 min', sub: 'Ciclo de actualización' },
            ].map(s => (
              <div key={s.val} className="rounded-lg p-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ODS Badges */}
        <div className="relative z-10 p-10 flex items-center gap-3">
          {[
            { num: 'ODS 11', label: 'Ciudades Sostenibles', bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.35)', c: '#FB923C' },
            { num: 'ODS 16', label: 'Paz y Justicia', bg: 'rgba(37,99,235,0.22)', border: 'rgba(37,99,235,0.4)', c: '#60A5FA' },
          ].map(b => (
            <div key={b.num} className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: b.bg, border: `1px solid ${b.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: b.c }}>{b.num}</span>
              <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.45)' }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right 60% ── */}
      <div className="flex flex-col flex-1 overflow-y-auto" style={{ background: '#F8FAFC' }}>
        <div className="flex flex-1 items-center justify-center px-8 py-10">
          <div style={{ width: '100%', maxWidth: 440 }}>

            {successUser ? (
              /* Success state */
              <div className="animate-fade-in">
                <div className="flex items-center justify-center mb-5">
                  <div className="rounded-full flex items-center justify-center"
                    style={{ width: 60, height: 60, background: 'rgba(16,185,129,0.1)', border: '2px solid #10B981' }}>
                    <CheckCircle size={30} color="#10B981" />
                  </div>
                </div>
                <h2 className="font-bold text-center mb-1" style={{ fontSize: 22, color: '#0F172A' }}>Acceso autorizado</h2>
                <p className="text-center mb-6" style={{ fontSize: 13, color: '#64748B' }}>
                  Bienvenido, <strong>{successUser.name}</strong> — {successUser.role}
                </p>
                <div className="rounded-xl p-4 mb-4" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
                      JWT ACCESS TOKEN · EXP 2h
                    </span>
                    <button onClick={() => setJwtRevealed(r => !r)}
                      style={{ fontSize: 9, color: '#60A5FA', fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {jwtRevealed ? 'OCULTAR' : 'REVELAR'}
                    </button>
                  </div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#34D399',
                    wordBreak: 'break-all', lineHeight: 1.7,
                    filter: jwtRevealed ? 'none' : 'blur(5px)', transition: 'filter 0.2s',
                    userSelect: jwtRevealed ? 'text' : 'none',
                  }}>{MOCK_JWT}</div>
                </div>
                <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 mb-4"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Info size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#92400E' }}>
                    Sesión válida <strong>2 horas</strong>. Cierre automático por inactividad.
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2" style={{ color: '#64748B', fontSize: 12 }}>
                  <div className="rounded-full animate-pulse" style={{ width: 7, height: 7, background: '#10B981' }} />
                  Redirigiendo al sistema...
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 4 }}>
                    Iniciar Sesión
                  </h2>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Plataforma de Gestión de Seguridad Ciudadana</p>
                </div>

                {/* Demo hint */}
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-5"
                  style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
                  <Info size={13} color="#3B82F6" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: '#1E40AF', lineHeight: 1.6 }}>
                    <strong>Demo:</strong>{' '}
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                      gabriel.perkovic@munismp.gob.pe / SecureGov2026!
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  {/* Email */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input type="email" value={email}
                        onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="usuario@munilima.gob.pe"
                        style={{
                          width: '100%', paddingLeft: 36, paddingRight: 12,
                          paddingTop: 10, paddingBottom: 10, fontSize: 13,
                          background: '#fff', border: `1.5px solid ${error ? '#DC2626' : '#E5E7EB'}`,
                          borderRadius: 8, outline: 'none', color: '#0F172A', fontFamily: 'Inter, sans-serif',
                        }}
                        onFocus={e => { if (!error) e.target.style.borderColor = '#1E3A8A'; }}
                        onBlur={e => { if (!error) e.target.style.borderColor = '#E5E7EB'; }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••••"
                        style={{
                          width: '100%', paddingLeft: 36, paddingRight: 42,
                          paddingTop: 10, paddingBottom: 10, fontSize: 13,
                          background: '#fff', border: `1.5px solid ${error ? '#DC2626' : '#E5E7EB'}`,
                          borderRadius: 8, outline: 'none', color: '#0F172A', fontFamily: 'Inter, sans-serif',
                        }}
                        onFocus={e => { if (!error) e.target.style.borderColor = '#1E3A8A'; }}
                        onBlur={e => { if (!error) e.target.style.borderColor = '#E5E7EB'; }}
                      />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Password strength */}
                    {password && (
                      <div className="mt-2 animate-fade-in">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: n <= strength.score ? strength.color : '#E5E7EB',
                              transition: 'background 0.2s',
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: strength.color, fontWeight: 500 }}>
                          Fortaleza: {strength.label}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role selector */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>
                      Rol de acceso
                    </label>
                    <div className="relative">
                      <select value={role} onChange={e => setRole(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 36px 10px 12px', fontSize: 13,
                          background: '#fff', border: '1.5px solid #E5E7EB',
                          borderRadius: 8, outline: 'none', color: '#0F172A',
                          appearance: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        }}
                        onFocus={e => e.target.style.borderColor = '#1E3A8A'}
                        onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 4 }}>
                      Control de acceso basado en roles (RBAC) — Ley N° 29733
                    </div>
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 13, color: '#374151' }}>
                      <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                        style={{ width: 15, height: 15, accentColor: '#1E3A8A', cursor: 'pointer' }} />
                      Recordarme
                    </label>
                    <button type="button"
                      style={{ fontSize: 13, color: '#1E3A8A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 animate-fade-in"
                      style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)' }}>
                      <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#B91C1C' }}>{error}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    style={{
                      width: '100%', padding: '12px 0', fontSize: 14, fontWeight: 600,
                      background: loading ? '#2a4fa0' : '#1E3A8A',
                      color: '#fff', border: 'none', borderRadius: 8,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: '0 2px 10px rgba(30,58,138,0.35)',
                      transition: 'background 0.15s',
                      marginTop: 4,
                    }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1e40af'; }}
                    onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#1E3A8A'; }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Verificando...
                      </>
                    ) : 'Iniciar Sesión'}
                  </button>
                </form>
              </>
            )}

            {/* Footer */}
            <div className="mt-8 pt-5" style={{ borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF' }}>
                Sesión expira en 2h | Protegido por <strong>Ley N° 29733</strong>
              </p>
              <p style={{ fontSize: 10, color: '#D1D5DB', marginTop: 3 }}>
                © 2026 Municipalidad de San Martín de Porres
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
