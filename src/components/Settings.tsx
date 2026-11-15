import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Bell,
  Brain,
  Key,
  ChevronRight,
  Check,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../services/auth";

const ROLES_INFO = [
  {
    id: "administrador",
    name: "Administrador del Sistema",
    description: "Acceso integral y exclusivo a todos los módulos, gestión de usuarios, auditoría y configuración del modelo.",
    permissions: [
      "Todos los módulos de la plataforma",
      "Gestión de usuarios y asignación de roles (RBAC)",
      "Configuración de parámetros y reentrenamiento ML",
      "Exportación de auditoría y reportes gerenciales",
    ],
    color: "#DC2626",
    badgeBg: "rgba(220, 38, 38, 0.15)",
    border: "rgba(220, 38, 38, 0.35)",
  },
  {
    id: "supervisor",
    name: "Supervisor de Operaciones",
    description: "Gestión y despacho táctico de patrullas, atención de alertas tempranas y monitoreo de campo en tiempo real.",
    permissions: [
      "Mapa de calor interactivo y predicción",
      "Simulador de patrullaje táctico y re-enrutamiento",
      "Recepción y despacho de alertas críticas",
      "Dashboard operacional y estado de cuadrantes",
    ],
    color: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.35)",
  },
  {
    id: "analista",
    name: "Analista de Inteligencia Criminal",
    description: "Evaluación de patrones delictivos, explicabilidad del modelo predictivo (SHAP) y generación de reportes.",
    permissions: [
      "Dashboard analítico de tendencias",
      "Análisis de explicabilidad IA (Valores SHAP)",
      "Mapa de calor y clustering delictivo",
      "Generación y exportación de reportes ejecutivos",
    ],
    color: "#3B82F6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.35)",
  },
  {
    id: "operador",
    name: "Operador de Serenazgo",
    description: "Monitoreo en campo y verificación de celdas de calor en su sector territorial asignado.",
    permissions: [
      "Mapa de calor en vivo (sectorial)",
      "Recepción y atención de alertas",
    ],
    color: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.35)",
  },
];

const INITIAL_MODEL_CONFIG = [
  { key: "HORIZONTE_PREDICCIÓN", value: "6 horas", editable: true },
  { key: "UMBRAL_ALERTA_ALTA", value: "0.70", editable: true },
  { key: "UMBRAL_ALERTA_CRÍTICA", value: "0.85", editable: true },
  { key: "TAMAÑO_CELDA_METROS", value: "500", editable: false },
  { key: "ACTUALIZACIÓN_MODELO", value: "Cada 15 min", editable: true },
  { key: "FEATURES_ACTIVAS", value: "52 variables", editable: false },
  { key: "DISTRITOS_CUBIERTOS", value: "43 distritos", editable: false },
];

const INITIAL_NOTIFICATION_RULES = [
  { id: 1, label: "Alerta crítica (Riesgo predicho > 85%)", channels: ["Push", "Email", "SMS"], delay: "Inmediato", active: true },
  { id: 2, label: "Zona de alto riesgo sin patrullaje > 20 min", channels: ["Push", "Radio"], delay: "5 min", active: true },
  { id: 3, label: "Reporte diario consolidado de incidentes", channels: ["Email"], delay: "06:00 AM", active: true },
  { id: 4, label: "Desviación de métrica de precisión (F1 < 80%)", channels: ["Email", "Slack"], delay: "Inmediato", active: true },
  { id: 5, label: "Notificación de reentrenamiento de modelo exitoso", channels: ["Slack"], delay: "Inmediato", active: false },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "model" | "notifications">("roles");
  const [users, setUsers] = useState<any[]>([]);
  const [modelConfig, setModelConfig] = useState(INITIAL_MODEL_CONFIG);
  const [rules, setRules] = useState(INITIAL_NOTIFICATION_RULES);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Modal para nuevo usuario
  const [showUserModal, setShowUserModal] = useState(false);
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uRole, setURole] = useState("operador");
  const [uDistrict, setUDistrict] = useState("San Martín de Porres");
  const [uPassword, setUPassword] = useState("");

  // Modal para editar usuario
  const [editingSettingsUser, setEditingSettingsUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("operador");
  const [editDistrict, setEditDistrict] = useState("San Martín de Porres");
  const [editPassword, setEditPassword] = useState("");

  // Modal para confirmar eliminación de usuario
  const [deletingSettingsUser, setDeletingSettingsUser] = useState<any | null>(null);

  // Modal para editar parámetro del modelo
  const [editingParam, setEditingParam] = useState<{ key: string; value: string } | null>(null);
  const [newParamValue, setNewParamValue] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleCreateUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    const created = await createUser({
      nombre: uName,
      email: uEmail,
      rol: uRole,
      distrito: uDistrict,
      password: uPassword,
    });
    setUsers([...users, created]);
    setShowUserModal(false);
    setUName("");
    setUEmail("");
    setUPassword("");
  }

  function handleOpenEdit(u: any) {
    setEditingSettingsUser(u);
    setEditName(u.nombre || "");
    setEditEmail(u.email || "");
    setEditRole(u.rol || "operador");
    setEditDistrict(u.distrito || "Lima Centro");
    setEditPassword("");
  }

  async function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSettingsUser) return;
    const payload: any = {
      nombre: editName,
      email: editEmail,
      rol: editRole,
      distrito: editDistrict,
    };
    if (editPassword.trim().length >= 6) {
      payload.password = editPassword.trim();
    }
    const updated = await updateUser(editingSettingsUser.id, payload);
    setUsers(
      users.map((u) => (u.id === editingSettingsUser.id ? { ...u, ...updated } : u))
    );
    setEditingSettingsUser(null);
  }

  async function handleDeleteConfirm() {
    if (!deletingSettingsUser) return;
    await deleteUser(deletingSettingsUser.id);
    setUsers(users.filter((u) => u.id !== deletingSettingsUser.id));
    setDeletingSettingsUser(null);
  }

  async function handleToggleStatus(userId: number) {
    await toggleUserStatus(userId);
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, activo: !u.activo } : u))
    );
  }

  function handleSaveParam() {
    if (!editingParam) return;
    setModelConfig(
      modelConfig.map((item) =>
        item.key === editingParam.key ? { ...item, value: newParamValue } : item
      )
    );
    setEditingParam(null);
  }

  function toggleRuleActive(id: number) {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060D1A] text-white">
      {/* Pestañas de Navegación Superior */}
      <div className="flex items-center gap-1 px-6 py-3.5 bg-[#0D1728] border-b border-white/10 shrink-0">
        {[
          { id: "roles", icon: Shield, label: "Roles y Permisos (RBAC)" },
          { id: "users", icon: Users, label: "Usuarios Institucionales" },
          { id: "model", icon: Brain, label: "Parámetros del Modelo IA" },
          { id: "notifications", icon: Bell, label: "Reglas de Notificación" },
        ].map(({ id, icon: Icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido según Pestaña */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* PESTAÑA: ROLES Y PERMISOS */}
        {activeTab === "roles" && (
          <div className="space-y-4 max-w-5xl">
            <div className="pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Estructura de Roles Institucionales y Niveles de Acceso
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configuración del modelo de seguridad RBAC de la Municipalidad de Lima
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ROLES_INFO.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-xl bg-[#0D1728] border space-y-3"
                  style={{ borderColor: r.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                        style={{ backgroundColor: r.badgeBg, color: r.color }}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{r.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Rol: {r.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase"
                      style={{ backgroundColor: r.badgeBg, color: r.color, border: `1px solid ${r.border}` }}
                    >
                      NIVEL OFICIAL
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block">
                      Permisos Otorgados:
                    </span>
                    {r.permissions.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: r.color }} />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: USUARIOS INSTITUCIONALES */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white">Nómina Activa de Usuarios</h2>
                <p className="text-xs text-slate-400">
                  Total de funcionarios con acceso al sistema: {users.length}
                </p>
              </div>

              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            <div className="bg-[#0D1728] rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08101E] text-slate-400 font-mono uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3">Funcionario</th>
                    <th className="px-5 py-3">Correo Institucional</th>
                    <th className="px-5 py-3">Rol Asignado</th>
                    <th className="px-5 py-3">Jurisdicción / Distrito</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {u.nombre}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {u.distrito || "Lima Centro"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            u.activo ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.activo ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          {u.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Editar usuario"
                            className="px-2 py-1 rounded text-[11px] font-medium border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                              u.activo
                                ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            }`}
                          >
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => setDeletingSettingsUser(u)}
                            title="Eliminar usuario"
                            className="px-2 py-1 rounded text-[11px] font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA: PARÁMETROS DEL MODELO IA */}
        {activeTab === "model" && (
          <div className="space-y-4 max-w-3xl">
            <div className="pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Configuración del Modelo de Inteligencia Artificial
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Variables operacionales del pipeline predictivo en memoria
              </p>
            </div>

            <div className="bg-[#0D1728] rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
              {modelConfig.map((item) => (
                <div
                  key={item.key}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02]"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-white block">
                      {item.key}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Valor actual configurado en tiempo de ejecución
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {item.value}
                    </span>

                    {item.editable ? (
                      <button
                        onClick={() => {
                          setEditingParam(item);
                          setNewParamValue(item.value);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-white/5">
                        FIJO
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA: REGLAS DE NOTIFICACIÓN */}
        {activeTab === "notifications" && (
          <div className="space-y-4 max-w-3xl">
            <div className="pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Canales y Reglas de Notificación Automática
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Disparadores automáticos de avisos a patrullas y centrales de monitoreo
              </p>
            </div>

            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-xl bg-[#0D1728] border border-white/10 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          rule.active ? "bg-emerald-400" : "bg-slate-600"
                        }`}
                      />
                      <h4 className="font-bold text-xs text-white">{rule.label}</h4>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Canales:</span>
                      {rule.channels.map((ch) => (
                        <span
                          key={ch}
                          className="px-2 py-0.5 rounded bg-white/5 font-mono text-[10px] text-slate-300"
                        >
                          {ch}
                        </span>
                      ))}
                      <span>· Despacho: {rule.delay}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleRuleActive(rule.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      rule.active
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-slate-500 border border-white/10"
                    }`}
                  >
                    {rule.active ? "Habilitado" : "Deshabilitado"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Editar Parámetro */}
      {editingParam && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              Modificar Parámetro: {editingParam.key}
            </h3>
            <input
              type="text"
              value={newParamValue}
              onChange={(e) => setNewParamValue(e.target.value)}
              className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingParam(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveParam}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg"
              >
                Actualizar Valor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Registrar Usuario Institucional</h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={uName}
                onChange={(e) => setUName(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <input
                type="email"
                required
                placeholder="Correo institucional (@serenazgo.gob.pe)"
                value={uEmail}
                onChange={(e) => setUEmail(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                >
                  <option value="administrador">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="analista">Analista</option>
                  <option value="operador">Operador</option>
                </select>
                <input
                  type="text"
                  placeholder="Distrito asignado"
                  value={uDistrict}
                  onChange={(e) => setUDistrict(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Contraseña inicial"
                value={uPassword}
                onChange={(e) => setUPassword(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario (Actualizar) */}
      {editingSettingsUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              Editar Funcionario Institucional
            </h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Correo Institucional</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Rol</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="administrador">Administrador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="analista">Analista</option>
                    <option value="operador">Operador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Distrito</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="En blanco para mantener"
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono placeholder:text-slate-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSettingsUser(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deletingSettingsUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Confirmar Eliminación de Funcionario
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              ¿Está seguro de eliminar al funcionario <strong className="text-white">{deletingSettingsUser.nombre}</strong> ({deletingSettingsUser.email})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletingSettingsUser(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
