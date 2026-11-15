import { useState, useEffect } from "react";
import {
  Download,
  Filter,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Search,
  Clock,
} from "lucide-react";
import { getAuditLogs } from "../services/systemService";

interface LogEntry {
  id: number;
  timestamp: string;
  user: string;
  user_email?: string;
  action: string;
  action_type: "login" | "config" | "model" | "export" | "alert";
  ip: string;
  details: string;
  status: "success" | "warning" | "error";
}

const ACTION_LABELS: Record<string, string> = {
  login: "Autenticación",
  config: "Configuración",
  model: "Inferencia IA",
  export: "Exportación",
  alert: "Alerta Emitida",
};

const USER_OPTIONS = [
  "Todos",
  "Com. César Morales",
  "Sup. Patricia Vega",
  "Analista Gabriela Torres",
  "Operador Manuel Quispe",
  "Sistema Automático",
];

const ACTION_TYPE_OPTIONS = [
  { value: "all", label: "Todas las acciones" },
  { value: "login", label: "Autenticación / Login" },
  { value: "config", label: "Cambios de Configuración" },
  { value: "model", label: "Ejecución de Modelo IA" },
  { value: "export", label: "Exportación de Reportes" },
  { value: "alert", label: "Despacho y Alertas" },
];

const PAGE_SIZE = 10;

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("Todos");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("2026-10-01");
  const [dateTo, setDateTo] = useState("2026-11-04");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
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

  const filteredLogs = logs.filter((l) => {
    const matchUser = userFilter === "Todos" || l.user.toLowerCase().includes(userFilter.toLowerCase());
    const matchAction = actionFilter === "all" || l.action_type === actionFilter;
    const matchStatus = statusFilter === "all" || l.status === statusFilter;

    // Filtro por rango de fecha
    const logDate = l.timestamp ? l.timestamp.split("T")[0] : "";
    const matchDate = (!dateFrom || logDate >= dateFrom) && (!dateTo || logDate <= dateTo);

    const matchSearch =
      !searchTerm ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip.includes(searchTerm);

    return matchUser && matchAction && matchStatus && matchDate && matchSearch;
  });

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Exportar a CSV real con formato UTF-8 BOM para Excel
  function exportCSV() {
    const headers = ["ID", "Fecha_Hora", "Funcionario", "Correo", "Accion", "Tipo_Evento", "Direccion_IP", "Detalles", "Estado"];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user}"`,
      `"${l.user_email || ""}"`,
      `"${l.action}"`,
      `"${l.action_type}"`,
      `"${l.ip}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.status.toUpperCase()}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Auditoria_PredictiSafe_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Se exportaron ${filteredLogs.length} registros de auditoría en formato CSV.`);
  }

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
      <div className="px-6 py-4 bg-[#0D1728] border-b border-white/10 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">
            Registro Oficial de Auditoría y Trazabilidad (Audit Logs)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Bitácora inmutable de accesos, ejecuciones del modelo y operaciones del sistema
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="px-6 py-3.5 bg-[#09111F] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Fecha Desde / Hasta */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Desde:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-[#0D1728] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Hasta:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-[#0D1728] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono"
            />
          </div>

          {/* Filtro Usuario */}
          <select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D1728] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
          >
            {USER_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          {/* Filtro Tipo de Acción */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D1728] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
          >
            {ACTION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Filtro Estado */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D1728] border border-white/10 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
          >
            <option value="all">Todos los estados</option>
            <option value="success">✓ Exitoso (OK)</option>
            <option value="warning">⚠ Advertencia</option>
            <option value="error">✗ Error</option>
          </select>
        </div>

        {/* Búsqueda en detalles */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por detalle o IP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D1728] border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none w-52"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-[#0D1728] rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-mono tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Funcionario / IP</th>
                  <th className="px-4 py-3">Acción Registrada</th>
                  <th className="px-4 py-3">Tipo de Evento</th>
                  <th className="px-4 py-3">Detalles</th>
                  <th className="px-4 py-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Cargando bitácora de auditoría...
                    </td>
                  </tr>
                ) : pagedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No se encontraron registros con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  pagedLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {l.timestamp.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{l.user}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{l.ip}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {l.action}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-white/5 border border-white/10 text-slate-300">
                          {ACTION_LABELS[l.action_type] || l.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={l.details}>
                        {l.details}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            l.status === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : l.status === "warning"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {l.status === "success" ? "✓ OK" : l.status === "warning" ? "⚠ AVISO" : "✗ ERROR"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-white/5 bg-[#08101E] flex items-center justify-between text-xs text-slate-400">
              <div>
                Mostrando {filteredLogs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} a{" "}
                {Math.min(page * PAGE_SIZE, filteredLogs.length)} de {filteredLogs.length} eventos
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-300">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
