import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  KeyRound,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { INSTITUTIONAL_ACCOUNTS } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("admin@serenazgo.gob.pe");
  const [password, setPassword] = useState("Admin2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("administrador");

  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate("/dashboard");
  }

  function handleSelectAccount(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedRole(acc.roleId);
  }

  return (
    <div className="min-h-screen bg-[#070D1A] flex flex-col justify-center items-center py-10 px-4 text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      <div className="w-full max-w-4xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Login */}
        <div className="lg:col-span-6 bg-[#0D1728] border border-white/10 rounded-2xl p-7 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-6 h-6 text-red-500" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">
                PredictiSafe Lima
              </h1>
              <p className="text-xs text-blue-400/80 font-mono tracking-wide">
                SISTEMA INTEGRADO DE SEGURIDAD CIUDADANA
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
              Acceso Institucional
            </h2>
            <p className="text-xs text-slate-400">
              Ingrese con sus credenciales oficiales para acceder según su rol asignado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Correo Electrónico Institucional
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm
                           text-white placeholder:text-slate-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                placeholder="usuario@serenazgo.gob.pe"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  Contraseña de Seguridad
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm
                             text-white placeholder:text-slate-500 pr-10
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium
                         rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Legal / Security badge */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Acceso RBAC auditado según <strong>Ley N° 29733</strong> de Protección de Datos Personales.
            </span>
          </div>
        </div>

        {/* Right Column: Roles & Real Accounts */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#0D1728]/80 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Credenciales por Rol Institucional
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                4 ROLES ACTIVOS
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              El sistema implementa Control de Acceso Basado en Roles (RBAC).
              Seleccione una cuenta para autocompletar credenciales y probar sus permisos funcionales:
            </p>

            <div className="space-y-3">
              {INSTITUTIONAL_ACCOUNTS.map((acc) => {
                const isSelected = selectedRole === acc.roleId && email === acc.email;
                return (
                  <div
                    key={acc.roleId}
                    onClick={() => handleSelectAccount(acc)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white/10 border-blue-500 ring-1 ring-blue-500/50"
                        : "bg-[#09111F] border-white/5 hover:border-white/20 hover:bg-[#0D182B]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: acc.badgeColor }}
                        />
                        <span className="text-xs font-bold text-white">
                          {acc.roleName}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                        style={{
                          backgroundColor: acc.badgeBg,
                          color: acc.badgeColor,
                          border: `1px solid ${acc.badgeBorder}`,
                        }}
                      >
                        {acc.roleId.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium mb-1">
                      {acc.name} · <span className="text-slate-400">{acc.district}</span>
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-white/5">
                      <span className="truncate">{acc.email}</span>
                      <span className="text-slate-500 font-mono">
                        clave: <span className="text-slate-300">{acc.password}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
