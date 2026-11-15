import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Car,
  Eye,
  Siren,
  ChevronRight,
  CheckCircle,
  Clock,
  Radio,
  Filter,
  Bell,
  X,
  MapPin,
  Plus,
  Send,
  ShieldAlert,
} from "lucide-react";
import {
  getAlerts,
  createAlert,
  dispatchAlert,
  resolveAlert,
  notifyAlertsChanged,
} from "../services/systemService";

const SEVERITY_COLOR: Record<string, string> = {
  low: "#3B82F6",
  medium: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

const SEVERITY_BG: Record<string, string> = {
  low: "rgba(59,130,246,0.12)",
  medium: "rgba(245,158,11,0.12)",
  high: "rgba(239,68,68,0.12)",
  critical: "rgba(220,38,38,0.15)",
};

const SEVERITY_BORDER: Record<string, string> = {
  low: "rgba(59,130,246,0.3)",
  medium: "rgba(245,158,11,0.3)",
  high: "rgba(239,68,68,0.35)",
  critical: "rgba(220,38,38,0.4)",
};

const TYPE_ICONS: Record<string, any> = {
  robbery: AlertTriangle,
  assault: Siren,
  vehicle: Car,
  suspicious: Eye,
  emergency: Radio,
};

const TYPE_LABELS: Record<string, string> = {
  robbery: "Robo Agravado",
  assault: "Asalto / Agresión",
  vehicle: "Hurto de Vehículo",
  suspicious: "Actividad Sospechosa",
  emergency: "Emergencia Ciudadana",
};

const STATUS_COLOR: Record<string, string> = {
  active: "#DC2626",
  responding: "#F59E0B",
  resolved: "#10B981",
};

const STATUS_LABEL: Record<string, string> = {
  active: "ACTIVO",
  responding: "EN ATENCIÓN",
  resolved: "RESUELTO",
};

const AVAILABLE_PATROLS = [
  "SMP-01 (Móvil Centro)",
  "SMP-02 (Condevilla)",
  "LIM-01 (Alfonso Ugarte)",
  "MIRA-01 (Miraflores Táctico)",
  "BRE-01 (Breña Central)",
  "VIC-02 (La Victoria Gamarra)",
];

export default function AlertSystem() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>("A-001");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal para despachar patrulla
  const [dispatchModalAlert, setDispatchModalAlert] = useState<any | null>(null);
  const [selectedUnit, setSelectedUnit] = useState(AVAILABLE_PATROLS[0]);

  // Modal para nueva alerta
  const [showNewAlertModal, setShowNewAlertModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("robbery");
  const [newDistrict, setNewDistrict] = useState("San Martín de Porres");
  const [newLocation, setNewLocation] = useState("");
  const [newSeverity, setNewSeverity] = useState("high");
  const [newDescription, setNewDescription] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    const handleUpdate = () => {
      getAlerts().then((data) => {
        if (Array.isArray(data)) setAlerts(data);
      });
    };
    window.addEventListener("alerts-changed", handleUpdate);
    return () => window.removeEventListener("alerts-changed", handleUpdate);
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function handleDispatch(alertId: string) {
    const unitClean = selectedUnit.split(" ")[0];
    await dispatchAlert(alertId, unitClean);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: "responding", assignedPatrol: unitClean }
          : a
      )
    );
    setDispatchModalAlert(null);
    showToast(`Unidad ${unitClean} despachada exitosamente a la alerta ${alertId}`);
  }

  async function handleResolve(alertId: string) {
    await resolveAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: "resolved" } : a))
    );
    showToast(`Alerta ${alertId} marcada como RESUELTA`);
  }

  function handleViewOnMap(alert: any) {
    // Redirigir al Mapa de Calor en /dashboard
    navigate(`/dashboard?lat=${alert.lat || -12.0464}&lng=${alert.lng || -77.0428}&alert=${alert.id}`);
  }

  async function handleCreateAlert(e: React.FormEvent) {
    e.preventDefault();
    const created = await createAlert({
      type: newType,
      title: newTitle || `Alerta en ${newDistrict}`,
      district: newDistrict,
      location: newLocation,
      severity: newSeverity,
      description: newDescription,
    });
    setAlerts([created, ...alerts]);
    setShowNewAlertModal(false);
    setNewTitle("");
    setNewLocation("");
    setNewDescription("");
    showToast(`Nueva alerta ${created.id} emitida al sistema`);
  }

  const filteredAlerts = alerts.filter((a) => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchSeverity = severityFilter === "all" || a.severity === severityFilter;
    const matchSearch =
      !searchTerm ||
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.district?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSeverity && matchSearch;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060D1A] text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-emerald-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 bg-[#0D1728] border-b border-white/10 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold tracking-tight">
              Sistema de Alertas Tempranas en Tiempo Real
            </h1>
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {activeCount} ACTIVAS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoreo y despacho inmediato de incidentes en los 43 distritos de Lima
          </p>
        </div>

        <button
          onClick={() => setShowNewAlertModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Alerta Temprana</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="px-6 py-3 bg-[#09111F] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-mono text-[11px] uppercase mr-1">
            Estado:
          </span>
          {[
            { id: "all", label: "Todas" },
            { id: "active", label: "Activas" },
            { id: "responding", label: "En Atención" },
            { id: "resolved", label: "Resueltas" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                statusFilter === st.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0D1728] border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">Todas las Severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <input
            type="text"
            placeholder="Filtrar por dirección o distrito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#0D1728] border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none w-56"
          />
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Cargando alertas del sistema...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No se encontraron alertas con los filtros seleccionados.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = TYPE_ICONS[alert.type] || AlertTriangle;
            const expanded = expandedId === alert.id;
            const isCritical = alert.severity === "critical";

            return (
              <div
                key={alert.id}
                className="rounded-xl overflow-hidden border transition-all"
                style={{
                  backgroundColor: SEVERITY_BG[alert.severity] || "rgba(255,255,255,0.03)",
                  borderColor: SEVERITY_BORDER[alert.severity] || "rgba(255,255,255,0.1)",
                }}
              >
                {/* Header card button */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : alert.id)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left cursor-pointer hover:bg-white/[0.02]"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${SEVERITY_COLOR[alert.severity]}25`,
                      border: `1px solid ${SEVERITY_COLOR[alert.severity]}50`,
                      color: SEVERITY_COLOR[alert.severity],
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-white">
                        {TYPE_LABELS[alert.type] || alert.type} — {alert.district}
                      </span>
                      {isCritical && alert.status === "active" && (
                        <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-red-600 text-white animate-pulse">
                          CRÍTICO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{alert.location}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <span
                        className="font-mono font-bold text-xs block"
                        style={{ color: SEVERITY_COLOR[alert.severity] }}
                      >
                        {alert.time}
                      </span>
                      <span
                        className="font-mono text-[10px] font-semibold"
                        style={{ color: STATUS_COLOR[alert.status] }}
                      >
                        {STATUS_LABEL[alert.status]}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        expanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details & Actions */}
                {expanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3 bg-[#08101E]/40">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {alert.description}
                    </p>

                    {alert.assignedPatrol && (
                      <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg w-fit">
                        <Radio className="w-3.5 h-3.5" />
                        <span>
                          Unidad asignada: <strong>{alert.assignedPatrol}</strong>
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      {alert.status === "active" && (
                        <button
                          type="button"
                          onClick={() => setDispatchModalAlert(alert)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Despachar Patrulla</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleViewOnMap(alert)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        <span>Ver en Mapa</span>
                      </button>

                      {alert.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleResolve(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-lg ml-auto transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Marcar Resuelto</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Despachar Patrulla */}
      {dispatchModalAlert && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              Despachar Unidad a Alerta {dispatchModalAlert.id}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Ubicación: <strong>{dispatchModalAlert.location}</strong> ({dispatchModalAlert.district})
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs text-slate-300 font-medium">
                Seleccione unidad de patrullaje disponible:
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {AVAILABLE_PATROLS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDispatchModalAlert(null)}
                className="px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDispatch(dispatchModalAlert.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg"
              >
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Alerta Temprana */}
      {showNewAlertModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Emitir Alerta Temprana de Seguridad
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Notifica a todas las unidades de serenazgo y comisaría del cuadrante
            </p>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Título del incidente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Asalto con arma de fuego a transeúnte"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tipo de delito</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="robbery">Robo Agravado</option>
                    <option value="assault">Asalto / Agresión</option>
                    <option value="vehicle">Hurto de Vehículo</option>
                    <option value="suspicious">Sospechoso</option>
                    <option value="emergency">Emergencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Nivel de Severidad</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                  >
                    <option value="critical">Crítica (Roja)</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Distrito</label>
                  <input
                    type="text"
                    required
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="San Martín de Porres"
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Ubicación / Calle</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Av. Perú con Jr. Quilca"
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Detalles de la alerta</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descripción detallada de sospechosos, vehículos o personas afectadas..."
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewAlertModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg"
                >
                  Emitir Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
