import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Map,
  Users,
  LogOut,
  ShieldAlert,
  LayoutDashboard,
  Navigation2,
  Bell,
  BrainCircuit,
  FileBarChart2,
  ScrollText,
  Activity,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAlerts } from "../../services/systemService";

const ROLE_COLORS = {
  administrador: {
    color: "#DC2626",
    badgeBg: "rgba(220, 38, 38, 0.15)",
    border: "rgba(220, 38, 38, 0.35)",
    label: "Administrador",
  },
  supervisor: {
    color: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.35)",
    label: "Supervisor",
  },
  analista: {
    color: "#3B82F6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.35)",
    label: "Analista",
  },
  operador: {
    color: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.35)",
    label: "Operador",
  },
};

const ALL_OPERATIONS = [
  {
    to: "/dashboard/operativo",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["administrador", "supervisor", "analista"],
  },
  {
    to: "/dashboard",
    label: "Mapa de calor",
    icon: Map,
    end: true,
    roles: ["administrador", "supervisor", "analista", "operador"],
  },
  {
    to: "/dashboard/simulador",
    label: "Simulador",
    icon: Navigation2,
    roles: ["administrador", "supervisor"],
  },
  {
    to: "/dashboard/alertas",
    label: "Alertas",
    icon: Bell,
    roles: ["administrador", "supervisor", "analista", "operador"],
  },
  {
    to: "/dashboard/ia",
    label: "Análisis IA",
    icon: BrainCircuit,
    roles: ["administrador", "analista"],
  },
];

const ALL_MANAGEMENT = [
  {
    to: "/dashboard/reportes",
    label: "Reportes",
    icon: FileBarChart2,
    roles: ["administrador", "supervisor", "analista"],
  },
  {
    to: "/dashboard/auditoria",
    label: "Logs auditoría",
    icon: ScrollText,
    roles: ["administrador"],
  },
  {
    to: "/dashboard/estado",
    label: "Estado sistema",
    icon: Activity,
    roles: ["administrador", "supervisor"],
  },
  {
    to: "/dashboard/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: ["administrador"],
  },
  {
    to: "/dashboard/ajustes",
    label: "Ajustes",
    icon: SlidersHorizontal,
    roles: ["administrador"],
  },
];

const ALL_ADMIN = [
  {
    to: "/dashboard/usuarios",
    label: "Usuarios y Roles",
    icon: Users,
    roles: ["administrador", "supervisor"],
  },
];

function NavSection({ title, links, alertCount }) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-[10px] font-mono tracking-widest text-base-muted/70 uppercase">
        {title}
      </p>
      <div className="space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-base-line text-base-text font-medium"
                  : "text-base-muted hover:text-base-text hover:bg-base-line/50"
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate flex-1">{label}</span>
            {label === "Alertas" && alertCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-risk-high text-white rounded-full leading-none animate-pulse">
                {alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { logout, user } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchCount = async () => {
      try {
        const list = await getAlerts();
        if (isMounted && Array.isArray(list)) {
          const count = list.filter((a) => a.status === "active").length;
          setAlertCount(count);
        }
      } catch (err) {
        console.error("Error al obtener alertas activas:", err);
      }
    };

    fetchCount();

    const handleAlertsChanged = () => {
      fetchCount();
    };

    window.addEventListener("alerts-changed", handleAlertsChanged);
    const interval = setInterval(fetchCount, 3000);

    return () => {
      isMounted = false;
      window.removeEventListener("alerts-changed", handleAlertsChanged);
      clearInterval(interval);
    };
  }, []);

  const currentRole = (user?.role || user?.rol || "operador").toLowerCase();
  const roleConfig = ROLE_COLORS[currentRole] || ROLE_COLORS.operador;

  // Filtrado de módulos según rol RBAC
  const userOperations = ALL_OPERATIONS.filter((item) =>
    item.roles.includes(currentRole)
  );
  const userManagement = ALL_MANAGEMENT.filter((item) =>
    item.roles.includes(currentRole)
  );
  const userAdmin = ALL_ADMIN.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <aside className="w-64 shrink-0 bg-base-surface border-r border-base-line flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-base-line">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
          <ShieldAlert className="w-5 h-5 text-risk-high" strokeWidth={1.75} />
        </div>
        <div>
          <span className="text-sm font-bold text-base-text leading-tight tracking-tight block">
            PredictiSafe Lima
          </span>
          <span className="text-[10px] font-mono text-base-muted tracking-wide">
            SEGURIDAD CIUDADANA
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <NavSection title="Operaciones" links={userOperations} alertCount={alertCount} />
        <NavSection title="Gestión y Análisis" links={userManagement} alertCount={alertCount} />
        <NavSection title="Administración" links={userAdmin} alertCount={alertCount} />
      </nav>

      {/* Alertas activas en tiempo real */}
      <div
        className={`px-3.5 py-2 mx-3 mb-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
          alertCount > 0
            ? "bg-risk-high/15 border-risk-high/30 text-risk-high shadow-sm shadow-risk-high/10"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        }`}
      >
        <span className="flex items-center gap-2 font-medium">
          <span className="relative flex h-2 w-2">
            {alertCount > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                alertCount > 0 ? "bg-risk-high" : "bg-emerald-400"
              }`}
            ></span>
          </span>
          {alertCount > 0 ? "Alertas activas" : "Sin alertas activas"}
        </span>
        <span
          className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-full ${
            alertCount > 0
              ? "bg-risk-high text-white shadow-sm"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {alertCount}
        </span>
      </div>

      {/* User Institutional Footer */}
      <div className="px-3 py-3 border-t border-base-line bg-[#0A1222]/50">
        <div className="p-2.5 rounded-lg border border-base-line/60 bg-base-bg/60 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
              style={{
                backgroundColor: roleConfig.badgeBg,
                color: roleConfig.color,
                border: `1px solid ${roleConfig.border}`,
              }}
            >
              {user?.initials || "US"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-base-text truncate">
                {user?.nombre || user?.name || "Usuario"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded"
                  style={{
                    backgroundColor: roleConfig.badgeBg,
                    color: roleConfig.color,
                    border: `1px solid ${roleConfig.border}`,
                  }}
                >
                  {roleConfig.label.toUpperCase()}
                </span>
                <span className="text-[10px] text-base-muted truncate">
                  {user?.distrito || "Lima"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-base-muted truncate mt-1.5 px-0.5">
            {user?.email}
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium
                     text-base-muted hover:text-risk-high hover:bg-risk-high/10 border border-transparent hover:border-risk-high/30 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          Cerrar sesión institucional
        </button>
      </div>
    </aside>
  );
}
