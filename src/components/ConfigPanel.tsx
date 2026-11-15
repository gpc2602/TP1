import { useState, useEffect } from "react";
import {
  Sliders,
  Users,
  MapPin,
  Layers,
  AlertTriangle,
  Lock,
  X,
  Clock,
  CheckCircle,
  RefreshCw,
  Plus,
  Building2,
  Phone,
  Shield,
  Search,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from "../services/auth";
import {
  getComisarias,
  addComisaria,
  getZonas,
  addZona,
  getAuditLogs,
} from "../services/systemService";

const SIDEBAR_TABS = [
  { id: "general", icon: Sliders, label: "Parámetros Generales" },
  { id: "users", icon: Users, label: "Gestión de Usuarios" },
  { id: "comisarias", icon: MapPin, label: "Comisarías PNP" },
  { id: "zones", icon: Layers, label: "Zonas y Cuadrantes" },
];

export default function ConfigPanel() {
  const [activeTab, setActiveTab] = useState("general");

  // Parámetros Generales
  const [criticalThreshold, setCriticalThreshold] = useState(75);
  const [moderateThreshold, setModerateThreshold] = useState(50);
  const [nEstimators, setNEstimators] = useState("200");
  const [learningRate, setLearningRate] = useState("0.1");
  const [maxDepth, setMaxDepth] = useState("6");
  const [subSample, setSubSample] = useState("0.8");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showRetrainModal, setShowRetrainModal] = useState(false);
  const [retrainPassword, setRetrainPassword] = useState("");
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  // Usuarios
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("operador");
  const [newUserDistrito, setNewUserDistrito] = useState("San Martín de Porres");
  const [newUserPassword, setNewUserPassword] = useState("");

  // Modales Editar y Eliminar Usuario en ConfigPanel
  const [editingConfigUser, setEditingConfigUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState("operador");
  const [editUserDistrito, setEditUserDistrito] = useState("San Martín de Porres");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [deletingConfigUser, setDeletingConfigUser] = useState<any | null>(null);

  // Comisarías
  const [comisarias, setComisarias] = useState<any[]>([]);
  const [showAddComisariaModal, setShowAddComisariaModal] = useState(false);
  const [newComisariaNombre, setNewComisariaNombre] = useState("");
  const [newComisariaDistrito, setNewComisariaDistrito] = useState("San Martín de Porres");
  const [newComisariaDireccion, setNewComisariaDireccion] = useState("");
  const [newComisariaTelefono, setNewComisariaTelefono] = useState("");
  const [newComisariaOficial, setNewComisariaOficial] = useState("");

  // Zonas
  const [zonas, setZonas] = useState<any[]>([]);
  const [showAddZonaModal, setShowAddZonaModal] = useState(false);
  const [newZonaNombre, setNewZonaNombre] = useState("");
  const [newZonaDistrito, setNewZonaDistrito] = useState("San Martín de Porres");
  const [newZonaRiesgo, setNewZonaRiesgo] = useState("Alto");
  const [newZonaSupervisor, setNewZonaSupervisor] = useState("Sup. Patricia Vega");

  // Auditoría en vivo del panel lateral
  const [auditList, setAuditList] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const [uData, cData, zData, aData] = await Promise.all([
        getUsers(),
        getComisarias(),
        getZonas(),
        getAuditLogs(),
      ]);
      setUsersList(uData);
      setComisarias(cData);
      setZonas(zData);
      setAuditList(aData);
    } catch (e) {
      console.error(e);
    }
  }

  function handleSaveGeneral() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  function handleConfirmRetrain() {
    setRetraining(true);
    setTimeout(() => {
      setRetraining(false);
      setRetrainSuccess(true);
      setShowRetrainModal(false);
      setTimeout(() => setRetrainSuccess(false), 4000);
    }, 1500);
  }

  async function handleCreateUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    const created = await createUser({
      nombre: newUserName,
      email: newUserEmail,
      rol: newUserRole,
      distrito: newUserDistrito,
      password: newUserPassword,
    });
    setUsersList([...usersList, created]);
    setShowAddUserModal(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
  }

  async function handleToggleUser(userId: number) {
    await toggleUserStatus(userId);
    setUsersList(
      usersList.map((u) => (u.id === userId ? { ...u, activo: !u.activo } : u))
    );
  }

  function handleOpenEditUser(u: any) {
    setEditingConfigUser(u);
    setEditUserName(u.nombre || "");
    setEditUserEmail(u.email || "");
    setEditUserRole(u.rol || "operador");
    setEditUserDistrito(u.distrito || "San Martín de Porres");
    setEditUserPassword("");
  }

  async function handleUpdateConfigUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConfigUser) return;
    const payload: any = {
      nombre: editUserName,
      email: editUserEmail,
      rol: editUserRole,
      distrito: editUserDistrito,
    };
    if (editUserPassword.trim().length >= 6) {
      payload.password = editUserPassword.trim();
    }
    const updated = await updateUser(editingConfigUser.id, payload);
    setUsersList(
      usersList.map((u) => (u.id === editingConfigUser.id ? { ...u, ...updated } : u))
    );
    setEditingConfigUser(null);
  }

  async function handleDeleteConfigUser() {
    if (!deletingConfigUser) return;
    await deleteUser(deletingConfigUser.id);
    setUsersList(usersList.filter((u) => u.id !== deletingConfigUser.id));
    setDeletingConfigUser(null);
  }

  async function handleCreateComisaria(e: React.FormEvent) {
    e.preventDefault();
    const created = await addComisaria({
      nombre: newComisariaNombre,
      distrito: newComisariaDistrito,
      direccion: newComisariaDireccion,
      telefono: newComisariaTelefono,
      comisario: newComisariaOficial,
      patrullas_asignadas: 6,
      efectivos: 35,
      estado: "Operativa",
    });
    setComisarias([...comisarias, created]);
    setShowAddComisariaModal(false);
    setNewComisariaNombre("");
    setNewComisariaDireccion("");
    setNewComisariaTelefono("");
    setNewComisariaOficial("");
  }

  async function handleCreateZona(e: React.FormEvent) {
    e.preventDefault();
    const created = await addZona({
      codigo: `SEC-0${zonas.length + 1}`,
      nombre: newZonaNombre,
      distrito: newZonaDistrito,
      nivel_riesgo: newZonaRiesgo,
      supervisor_cargo: newZonaSupervisor,
      patrullas_activas: 4,
      poblacion_estimada: "60,000 hab.",
      cobertura: "85%",
      delitos_frecuentes: ["Robo al paso", "Arrebato"],
    });
    setZonas([...zonas, created]);
    setShowAddZonaModal(false);
    setNewZonaNombre("");
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#060D1A] text-white">
      {/* Columna Izquierda: Pestañas de Configuración */}
      <div className="w-60 shrink-0 border-r border-white/10 bg-[#0D1728] p-3 flex flex-col space-y-1">
        <div className="px-3 py-3 mb-2 border-b border-white/10">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block">
            Panel de Control
          </span>
          <h2 className="text-sm font-bold text-white">Configuración del Sistema</h2>
        </div>

        {SIDEBAR_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Central según Pestaña */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* PESTAÑA 1: PARÁMETROS GENERALES */}
        {activeTab === "general" && (
          <div className="space-y-6 max-w-3xl">
            {savedSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span>Parámetros de configuración guardados y sincronizados correctamente.</span>
              </div>
            )}

            {retrainSuccess && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400 flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span>Reentrenamiento de modelo ejecutado exitosamente en memoria.</span>
              </div>
            )}

            {/* Umbrales de Alerta */}
            <div className="p-5 rounded-xl bg-[#0D1728] border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white">Umbrales de Activación de Alertas</h3>
                  <p className="text-xs text-slate-400">
                    Define la probabilidad predicha por el modelo que dispara notificaciones
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  EN VIVO
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1.5 font-semibold">
                    <span className="text-red-400">Umbral Crítico (Máxima Prioridad)</span>
                    <span className="font-mono text-red-400 font-bold">{criticalThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                    className="w-full h-2 rounded bg-slate-700 accent-red-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 font-semibold">
                    <span className="text-amber-400">Umbral Moderado (Monitoreo Reforzado)</span>
                    <span className="font-mono text-amber-400 font-bold">{moderateThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="70"
                    value={moderateThreshold}
                    onChange={(e) => setModerateThreshold(Number(e.target.value))}
                    className="w-full h-2 rounded bg-slate-700 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Hiperparámetros de Machine Learning */}
            <div className="p-5 rounded-xl bg-[#0D1728] border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white">Hiperparámetros del Modelo Predictivo</h3>
                  <p className="text-xs text-slate-400">
                    Ajustes de calibración para Random Forest / XGBoost en Lima Metropolitana
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                  v2.4 PRODUCCIÓN
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">N_ESTIMATORS (Árboles)</label>
                  <input
                    type="number"
                    value={nEstimators}
                    onChange={(e) => setNEstimators(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">LEARNING_RATE</label>
                  <input
                    type="text"
                    value={learningRate}
                    onChange={(e) => setLearningRate(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">MAX_DEPTH (Profundidad)</label>
                  <input
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">SUBSAMPLE</label>
                  <input
                    type="text"
                    value={subSample}
                    onChange={(e) => setSubSample(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setShowRetrainModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-semibold transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Reentrenar Modelo Predictivo</span>
                </button>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGeneral}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Guardar Configuración General</span>
              </button>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: USUARIOS */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white">Nómina de Usuarios Institucionales</h2>
                <p className="text-xs text-slate-400">
                  Control de accesos y credenciales del personal de Serenazgo y Municipalidad
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            <div className="bg-[#0D1728] rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08101E] text-slate-400 uppercase font-mono tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Funcionario</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Distrito</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-semibold text-white">{u.nombre}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{u.distrito || "Lima"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            title="Editar usuario"
                            className="px-2 py-1 text-[11px] rounded border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleToggleUser(u.id)}
                            className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                              u.activo
                                ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                                : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            }`}
                          >
                            {u.activo ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => setDeletingConfigUser(u)}
                            title="Eliminar usuario"
                            className="px-2 py-1 text-[11px] rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1"
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

        {/* PESTAÑA 3: COMISARÍAS PNP */}
        {activeTab === "comisarias" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white">Directorio de Comisarías PNP de Lima</h2>
                <p className="text-xs text-slate-400">
                  Dependencias policiales interconectadas con el sistema de prevención
                </p>
              </div>
              <button
                onClick={() => setShowAddComisariaModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Comisaría</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comisarias.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#0D1728] border border-white/10 space-y-2 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{c.nombre}</h4>
                      <span className="text-[11px] text-blue-400 font-mono">{c.distrito}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {c.estado}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 pt-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{c.direccion}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono">{c.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{c.comisario}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
                    <span>{c.patrullas_asignadas} Patrullas</span>
                    <span>{c.efectivos} Efectivos PNP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: ZONAS Y CUADRANTES */}
        {activeTab === "zones" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white">Sectores y Cuadrantes Operacionales</h2>
                <p className="text-xs text-slate-400">
                  Zonificación táctica y asignación de supervisión de patrullaje
                </p>
              </div>
              <button
                onClick={() => setShowAddZonaModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Zona</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zonas.map((z) => (
                <div
                  key={z.id}
                  className="p-4 rounded-xl bg-[#0D1728] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                        {z.codigo}
                      </span>
                      <h4 className="font-bold text-xs text-white truncate">{z.nombre}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        z.nivel_riesgo === "Crítico"
                          ? "bg-red-500/20 text-red-400"
                          : z.nivel_riesgo === "Alto"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {z.nivel_riesgo.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Supervisor a cargo:</span>
                      <strong>{z.supervisor_cargo}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Población aproximada:</span>
                      <span>{z.poblacion_estimada}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Patrullas activas:</span>
                      <span className="text-emerald-400 font-bold">{z.patrullas_activas} unidades</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Cobertura:</span>
                      <span className="text-blue-400 font-bold">{z.cobertura}</span>
                    </div>
                  </div>

                  {z.delitos_frecuentes && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap gap-1">
                      {z.delitos_frecuentes.map((d: string, i: number) => (
                        <span key={i} className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna Derecha: Bitácora de Auditoría en Tiempo Real */}
      <div className="w-72 shrink-0 border-l border-white/10 bg-[#0D1728] p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold uppercase text-slate-300">
            Trazabilidad en Vivo
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {auditList.slice(0, 8).map((log) => (
            <div key={log.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{log.user}</span>
                <span>{log.timestamp ? log.timestamp.substring(11, 16) : ""}</span>
              </div>
              <p className="font-semibold text-slate-200 text-[11px] leading-tight">
                {log.action}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {log.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Reentrenar Modelo */}
      {showRetrainModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Confirmar Reentrenamiento del Modelo
            </h3>
            <p className="text-xs text-slate-300">
              Esta operación compilará las variables de los 43 distritos y actualizará el archivo en memoria.
            </p>
            <input
              type="password"
              placeholder="Contraseña de Administrador"
              value={retrainPassword}
              onChange={(e) => setRetrainPassword(e.target.value)}
              className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRetrainModal(false)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRetrain}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg shadow-lg"
              >
                {retraining ? "Entrenando..." : "Ejecutar Reentrenamiento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nuevo Usuario */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Registrar Usuario Institucional</h3>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Nombre completo"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <input
                type="email"
                required
                placeholder="Correo institucional"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                >
                  <option value="administrador">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="analista">Analista</option>
                  <option value="operador">Operador</option>
                </select>
                <input
                  type="text"
                  placeholder="Distrito"
                  value={newUserDistrito}
                  onChange={(e) => setNewUserDistrito(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Contraseña inicial"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Comisaría */}
      {showAddComisariaModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Registrar Nueva Comisaría PNP</h3>
            <form onSubmit={handleCreateComisaria} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Nombre de la Comisaría (ej. Comisaría PNP Laura Caller)"
                value={newComisariaNombre}
                onChange={(e) => setNewComisariaNombre(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Distrito"
                  value={newComisariaDistrito}
                  onChange={(e) => setNewComisariaDistrito(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Teléfono (ej. 01 481-0922)"
                  value={newComisariaTelefono}
                  onChange={(e) => setNewComisariaTelefono(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <input
                type="text"
                required
                placeholder="Dirección o Avenida"
                value={newComisariaDireccion}
                onChange={(e) => setNewComisariaDireccion(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <input
                type="text"
                required
                placeholder="Oficial Comisario a cargo (ej. Cmdte. PNP Víctor Morales)"
                value={newComisariaOficial}
                onChange={(e) => setNewComisariaOficial(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddComisariaModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Guardar Comisaría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Zona */}
      {showAddZonaModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3">Crear Nuevo Cuadrante de Patrullaje</h3>
            <form onSubmit={handleCreateZona} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Nombre del sector (ej. Sector 05 - Caquetá)"
                value={newZonaNombre}
                onChange={(e) => setNewZonaNombre(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Distrito"
                  value={newZonaDistrito}
                  onChange={(e) => setNewZonaDistrito(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                />
                <select
                  value={newZonaRiesgo}
                  onChange={(e) => setNewZonaRiesgo(e.target.value)}
                  className="bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                >
                  <option value="Crítico">Crítico</option>
                  <option value="Alto">Alto</option>
                  <option value="Medio">Medio</option>
                  <option value="Bajo">Bajo</option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Supervisor a cargo"
                value={newZonaSupervisor}
                onChange={(e) => setNewZonaSupervisor(e.target.value)}
                className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddZonaModal(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Crear Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Usuario */}
      {editingConfigUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              Actualizar Usuario Institucional
            </h3>
            <form onSubmit={handleUpdateConfigUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Correo Institucional</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Rol</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value)}
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
                    value={editUserDistrito}
                    onChange={(e) => setEditUserDistrito(e.target.value)}
                    className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  minLength={6}
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="En blanco para mantener"
                  className="w-full bg-[#08101E] border border-white/10 rounded-lg p-2 text-white font-mono placeholder:text-slate-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingConfigUser(null)}
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

      {/* MODAL: Eliminar Usuario */}
      {deletingConfigUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1728] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Confirmar Eliminación
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              ¿Eliminar definitivamente a <strong className="text-white">{deletingConfigUser.nombre}</strong> ({deletingConfigUser.email})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletingConfigUser(null)}
                className="px-3 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfigUser}
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
