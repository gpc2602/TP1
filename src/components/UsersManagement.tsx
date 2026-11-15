import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  Building2,
  Mail,
  UserCheck,
  Lock,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../services/auth";

const ROLE_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  administrador: {
    color: "#DC2626",
    bg: "rgba(220, 38, 38, 0.15)",
    border: "rgba(220, 38, 38, 0.35)",
    label: "Administrador",
  },
  supervisor: {
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.35)",
    label: "Supervisor",
  },
  analista: {
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.35)",
    label: "Analista",
  },
  operador: {
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.35)",
    label: "Operador",
  },
};

const RBAC_MODULES = [
  { name: "Mapa de Calor y Predicciones", admin: true, sup: true, ana: true, ope: true },
  { name: "Recepción y Monitoreo de Alertas", admin: true, sup: true, ana: true, ope: true },
  { name: "Dashboard Operativo General", admin: true, sup: true, ana: true, ope: false },
  { name: "Simulador de Patrullas Táctico", admin: true, sup: true, ana: false, ope: false },
  { name: "Análisis Explicabilidad SHAP (IA)", admin: true, sup: false, ana: true, ope: false },
  { name: "Generador de Reportes Delictivos", admin: true, sup: true, ana: true, ope: false },
  { name: "Monitor de Estado del Sistema", admin: true, sup: true, ana: false, ope: false },
  { name: "Logs de Auditoría y Trazabilidad", admin: true, sup: false, ana: false, ope: false },
  { name: "Configuración Avanzada de Modelo", admin: true, sup: false, ana: false, ope: false },
  { name: "Gestión de Usuarios y Roles (RBAC)", admin: true, sup: false, ana: false, ope: false },
];

export default function UsersManagement() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"users" | "rbac">("users");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal para nuevo usuario
  const [showModal, setShowModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRol, setNewRol] = useState("operador");
  const [newDistrito, setNewDistrito] = useState("Lima Centro");
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modal para editar usuario
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRol, setEditRol] = useState("operador");
  const [editDistrito, setEditDistrito] = useState("Lima Centro");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Modal para confirmar eliminación
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsersList(data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenEdit(u: any) {
    setEditingUser(u);
    setEditNombre(u.nombre || "");
    setEditEmail(u.email || "");
    setEditRol(u.rol || "operador");
    setEditDistrito(u.distrito || "Lima Centro");
    setEditPassword("");
    setEditError("");
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    setEditError("");
    try {
      const payload: any = {
        nombre: editNombre,
        email: editEmail,
        rol: editRol,
        distrito: editDistrito,
      };
      if (editPassword && editPassword.trim().length >= 6) {
        payload.password = editPassword.trim();
      }
      const updated = await updateUser(editingUser.id, payload);
      setUsersList((prev) =>
        prev.map((item) =>
          item.id === editingUser.id ? { ...item, ...updated } : item
        )
      );
      setEditingUser(null);
      showToast(`Usuario "${editNombre}" actualizado con éxito.`);
    } catch (err: any) {
      setEditError(
        err.response?.data?.detail || err.message || "Error al actualizar usuario"
      );
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingUser) return;
    setDeleteSubmitting(true);
    try {
      await deleteUser(deletingUser.id);
      setUsersList((prev) => prev.filter((item) => item.id !== deletingUser.id));
      showToast(`Usuario "${deletingUser.nombre}" eliminado del sistema.`);
      setDeletingUser(null);
    } catch (err: any) {
      showToast(
        err.response?.data?.detail || err.message || "Error al eliminar usuario"
      );
    } finally {
      setDeleteSubmitting(false);
    }
  }

  async function handleToggleStatus(userId: number) {
    try {
      const res = await toggleUserStatus(userId);
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, activo: res?.activo ?? !u.activo } : u
        )
      );
      const target = usersList.find((u) => u.id === userId);
      const isNowActive = res?.activo ?? !target?.activo;
      showToast(
        `Usuario ${target?.nombre || ""} ${isNowActive ? "activado" : "desactivado"}.`
      );
    } catch (e: any) {
      showToast("No se pudo cambiar el estado del usuario.");
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setModalError("");
    setSubmitting(true);
    try {
      const created = await createUser({
        nombre: newNombre,
        email: newEmail,
        password: newPassword,
        rol: newRol,
        distrito: newDistrito,
      });
      setUsersList((prev) => [...prev, created]);
      setShowModal(false);
      setNewNombre("");
      setNewEmail("");
      setNewPassword("");
      showToast(`Usuario "${created.nombre}" creado exitosamente.`);
    } catch (err: any) {
      setModalError(
        err.response?.data?.detail || err.message || "Error al crear usuario"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredUsers = usersList.filter((u) => {
    const matchSearch =
      u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.distrito?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.rol?.toLowerCase() === roleFilter;
    return matchSearch && matchRole;
  });

  const isAdmin = (user?.role || user?.rol || "").toLowerCase() === "administrador";

  return (
    <div className="h-full flex flex-col bg-[#070D1A] overflow-hidden text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-[#0D1728] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">
              Gestión de Usuarios y Control de Acceso (RBAC)
            </h1>
            <p className="text-xs text-slate-400">
              Administración de cuentas institucionales y permisos de la plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="bg-[#08101E] p-1 rounded-lg border border-white/10 flex gap-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Usuarios Activos
            </button>
            <button
              onClick={() => setActiveTab("rbac")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "rbac"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Matriz de Permisos
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "users" ? (
          <>
            {/* Filters bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0D1728] p-4 rounded-xl border border-white/10">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar usuario por nombre, correo o distrito..."
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["all", "administrador", "supervisor", "analista", "operador"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                      roleFilter === r
                        ? "bg-white/15 text-white border border-white/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {r === "all" ? "Todos los roles" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#0D1728] rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#08101E] text-slate-400 uppercase tracking-wider font-mono border-b border-white/10">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Usuario y Distrito</th>
                      <th className="px-5 py-3.5 font-semibold">Correo Institucional</th>
                      <th className="px-5 py-3.5 font-semibold">Rol Asignado</th>
                      <th className="px-5 py-3.5 font-semibold">Estado</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          Cargando usuarios institucionales...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                          No se encontraron usuarios con los criterios de búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const roleMeta =
                          ROLE_STYLES[u.rol?.toLowerCase()] || ROLE_STYLES.operador;
                        return (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                                  style={{
                                    backgroundColor: roleMeta.bg,
                                    color: roleMeta.color,
                                    border: `1px solid ${roleMeta.border}`,
                                  }}
                                >
                                  {u.nombre
                                    ?.split(" ")
                                    .slice(0, 2)
                                    .map((w: string) => w[0])
                                    .join("") || "US"}
                                </div>
                                <div>
                                  <span className="font-semibold text-white block">
                                    {u.nombre}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {u.distrito || "Lima Metropolitana"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-300">
                              {u.email}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase inline-block"
                                style={{
                                  backgroundColor: roleMeta.bg,
                                  color: roleMeta.color,
                                  border: `1px solid ${roleMeta.border}`,
                                }}
                              >
                                {roleMeta.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {u.activo ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Activo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-red-400 font-medium text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Inactivo
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {isAdmin && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Botón Editar / Actualizar */}
                                  <button
                                    onClick={() => handleOpenEdit(u)}
                                    title="Editar datos, correo y rol"
                                    className="px-2.5 py-1 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 text-[11px] font-medium transition-all flex items-center gap-1"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>

                                  {/* Botón Activar / Desactivar */}
                                  <button
                                    onClick={() => handleToggleStatus(u.id)}
                                    title={u.activo ? "Desactivar acceso" : "Activar acceso"}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                                      u.activo
                                        ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                        : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                    }`}
                                  >
                                    {u.activo ? "Desactivar" : "Activar"}
                                  </button>

                                  {/* Botón Eliminar */}
                                  <button
                                    onClick={() => setDeletingUser(u)}
                                    title="Eliminar usuario del sistema"
                                    className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-400 text-[11px] font-medium transition-all flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Matriz de Permisos RBAC */
          <div className="bg-[#0D1728] rounded-xl border border-white/10 p-6 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Matriz de Control de Acceso Basado en Roles (RBAC)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Políticas de seguridad y restricción de navegación activas en el sistema
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-white/10 rounded-lg overflow-hidden">
                <thead className="bg-[#08101E] text-slate-400 font-mono">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Módulo del Sistema</th>
                    <th className="px-4 py-3 text-center text-red-400 font-bold">ADMINISTRADOR</th>
                    <th className="px-4 py-3 text-center text-amber-400 font-bold">SUPERVISOR</th>
                    <th className="px-4 py-3 text-center text-blue-400 font-bold">ANALISTA</th>
                    <th className="px-4 py-3 text-center text-emerald-400 font-bold">OPERADOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {RBAC_MODULES.map((m, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-slate-200">
                        {m.name}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {m.admin ? (
                          <span className="text-emerald-400 font-bold">✔ Permitido</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {m.sup ? (
                          <span className="text-emerald-400 font-bold">✔ Permitido</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {m.ana ? (
                          <span className="text-emerald-400 font-bold">✔ Permitido</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {m.ope ? (
                          <span className="text-emerald-400 font-bold">✔ Permitido</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" />
              Registrar Nuevo Usuario Institucional
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Crea una cuenta con contraseña cifrada y rol asignado en la base de datos.
            </p>

            {modalError && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej. Sup. Carlos Mendoza"
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo Electrónico Institucional
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="cmendoza@serenazgo.gob.pe"
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Rol Institucional
                  </label>
                  <select
                    value={newRol}
                    onChange={(e) => setNewRol(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="analista">Analista</option>
                    <option value="operador">Operador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Distrito Asignado
                  </label>
                  <input
                    type="text"
                    value={newDistrito}
                    onChange={(e) => setNewDistrito(e.target.value)}
                    placeholder="San Isidro"
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                >
                  {submitting ? "Guardando..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario (Actualizar Datos, Rol y Distrito) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Actualizar Usuario Institucional</h2>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correo Electrónico Institucional
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Rol Institucional (RBAC)
                  </label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="analista">Analista</option>
                    <option value="operador">Operador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Distrito Asignado
                  </label>
                  <input
                    type="text"
                    value={editDistrito}
                    onChange={(e) => setEditDistrito(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nueva Contraseña (Opcional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar en blanco para conservar la actual"
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editSubmitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación (Eliminar Permanentemente) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirmar Eliminación de Usuario</h3>
                <p className="text-xs text-slate-400">Acción permanente e irreversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              ¿Está seguro de eliminar definitivamente al funcionario{" "}
              <strong className="text-white font-semibold">{deletingUser.nombre}</strong> (
              <span className="font-mono text-slate-200">{deletingUser.email}</span>)?
              Esta acción revocará todas sus credenciales y permisos en la plataforma de inmediato.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteSubmitting ? "Eliminando..." : "Eliminar Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
