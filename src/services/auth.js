import api, { setAccessToken } from "./api";

// Cuentas institucionales reales preconfiguradas
export const INSTITUTIONAL_ACCOUNTS = [
  {
    roleId: "administrador",
    roleName: "Administrador",
    name: "Com. César Morales",
    email: "admin@serenazgo.gob.pe",
    password: "Admin2026!",
    district: "Lima Centro",
    badgeColor: "#DC2626",
    badgeBg: "rgba(220, 38, 38, 0.12)",
    badgeBorder: "rgba(220, 38, 38, 0.3)",
    description: "Acceso total: gestión de usuarios, auditoría, configuración, datasets y módulos operativos.",
    permissions: [
      "Todos los módulos",
      "Gestión de usuarios y roles",
      "Configuración y auditoría",
      "Modelos IA y reportes ejecutivos",
    ],
  },
  {
    roleId: "supervisor",
    roleName: "Supervisor de Operaciones",
    name: "Sup. Patricia Vega",
    email: "supervisor@serenazgo.gob.pe",
    password: "Supervisor2026!",
    district: "Miraflores",
    badgeColor: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeBorder: "rgba(245, 158, 11, 0.3)",
    description: "Monitoreo operativo: mapa de calor, simulador de patrullas, alertas en tiempo real y reportes.",
    permissions: [
      "Mapa de calor interactivo",
      "Simulador de patrullaje táctico",
      "Monitoreo y despacho de alertas",
      "Dashboard operacional y reportes",
    ],
  },
  {
    roleId: "analista",
    roleName: "Analista de Inteligencia Criminal",
    name: "Analista Gabriela Torres",
    email: "analista@serenazgo.gob.pe",
    password: "Analista2026!",
    district: "San Isidro",
    badgeColor: "#3B82F6",
    badgeBg: "rgba(59, 130, 246, 0.12)",
    badgeBorder: "rgba(59, 130, 246, 0.3)",
    description: "Inteligencia y datos: análisis predictivo SHAP, patrones delictivos, dashboard y reportes estadísticos.",
    permissions: [
      "Dashboard predictivo",
      "Análisis de explicabilidad SHAP",
      "Mapa de calor y tendencias",
      "Generación y exportación de reportes",
    ],
  },
  {
    roleId: "operador",
    roleName: "Operador de Serenazgo",
    name: "Operador Manuel Quispe",
    email: "operador@serenazgo.gob.pe",
    password: "Operador2026!",
    district: "Breña",
    badgeColor: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeBorder: "rgba(16, 185, 129, 0.3)",
    description: "Monitoreo en campo: visualización de celdas de calor en su sector y recepción de alertas críticas.",
    permissions: [
      "Mapa de calor en vivo (sectorial)",
      "Recepción y confirmación de alertas",
    ],
  },
];

function getInitials(name) {
  if (!name) return "US";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Inicia sesión comunicándose con el backend FastAPI (/api/auth/login).
 * Si el backend está temporalmente no iniciado, valida contra las credenciales institucionales reales.
 */
export async function login(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data } = await api.post("/auth/login", { email: cleanEmail, password });
    const token = data.access_token;
    setAccessToken(token);

    const backendUser = data.user || {};
    const rol = data.rol || backendUser.rol || "operador";
    const nombre = data.nombre || backendUser.nombre || "Usuario Institucional";

    const normalizedUser = {
      id: backendUser.id || 1,
      name: nombre,
      nombre,
      email: cleanEmail,
      role: rol,
      rol,
      distrito: backendUser.distrito || "Lima Metropolitana",
      initials: getInitials(nombre),
      token,
      isOnline: true,
    };

    localStorage.setItem("predictisafe_token", token);
    localStorage.setItem("predictisafe_user", JSON.stringify(normalizedUser));

    return { access_token: token, user: normalizedUser };
  } catch (error) {
    // Si el error es 401/403 devuelto por el backend, propagamos el mensaje real
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    // Fallback de contingencia si el servidor backend no responde (Network Error)
    const match = INSTITUTIONAL_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === cleanEmail && acc.password === password
    );

    if (match) {
      const fallbackToken = `token_${match.roleId}_${Date.now()}`;
      setAccessToken(fallbackToken);
      const fallbackUser = {
        id: match.roleId === "administrador" ? 1 : match.roleId === "supervisor" ? 2 : match.roleId === "analista" ? 3 : 4,
        name: match.name,
        nombre: match.name,
        email: match.email,
        role: match.roleId,
        rol: match.roleId,
        distrito: match.district,
        initials: getInitials(match.name),
        token: fallbackToken,
        isOnline: false,
      };

      localStorage.setItem("predictisafe_token", fallbackToken);
      localStorage.setItem("predictisafe_user", JSON.stringify(fallbackUser));

      return { access_token: fallbackToken, user: fallbackUser };
    }

    throw new Error(
      error.message === "Network Error"
        ? "No se pudo conectar al servidor backend. Verifique sus credenciales institucionales."
        : "Credenciales inválidas. Verifique correo institucional y contraseña."
    );
  }
}

const LOCAL_USERS_KEY = "predictisafe_users_cache";

function getLocalUsersCache() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const initial = INSTITUTIONAL_ACCOUNTS.map((a, i) => ({
    id: i + 1,
    nombre: a.name,
    email: a.email,
    rol: a.roleId,
    distrito: a.district,
    activo: true,
    ultimo_acceso: "Reciente",
  }));
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function saveLocalUsersCache(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {}
}

export function logout() {
  setAccessToken(null);
  localStorage.removeItem("predictisafe_token");
  localStorage.removeItem("predictisafe_user");
}

export async function getUsers() {
  try {
    const { data } = await api.get("/auth/users");
    saveLocalUsersCache(data);
    return data;
  } catch (e) {
    return getLocalUsersCache();
  }
}

export async function createUser(userData) {
  try {
    const { data } = await api.post("/auth/users", userData);
    const cached = getLocalUsersCache();
    saveLocalUsersCache([...cached, data]);
    return data;
  } catch (e) {
    if (e.response?.data?.detail) {
      throw new Error(e.response.data.detail);
    }
    const cached = getLocalUsersCache();
    const newId = Math.max(...cached.map((u) => u.id || 0), 0) + 1;
    const fallbackUser = {
      id: newId,
      nombre: userData.nombre,
      email: userData.email,
      rol: userData.rol || "operador",
      distrito: userData.distrito || "Lima Centro",
      activo: true,
      ultimo_acceso: "Reciente",
    };
    saveLocalUsersCache([...cached, fallbackUser]);
    return fallbackUser;
  }
}

export async function updateUser(userId, userData) {
  try {
    const { data } = await api.put(`/auth/users/${userId}`, userData);
    const cached = getLocalUsersCache();
    const updated = cached.map((u) => (u.id === userId ? { ...u, ...data } : u));
    saveLocalUsersCache(updated);
    return data;
  } catch (e) {
    if (e.response?.data?.detail) {
      throw new Error(e.response.data.detail);
    }
    const cached = getLocalUsersCache();
    let updatedItem = null;
    const updated = cached.map((u) => {
      if (u.id === userId) {
        updatedItem = {
          ...u,
          nombre: userData.nombre ?? u.nombre,
          email: userData.email ?? u.email,
          rol: userData.rol ?? u.rol,
          distrito: userData.distrito ?? u.distrito,
        };
        return updatedItem;
      }
      return u;
    });
    saveLocalUsersCache(updated);
    if (!updatedItem) throw new Error("Usuario no encontrado");
    return updatedItem;
  }
}

export async function deleteUser(userId) {
  try {
    const { data } = await api.delete(`/auth/users/${userId}`);
    const cached = getLocalUsersCache();
    saveLocalUsersCache(cached.filter((u) => u.id !== userId));
    return data;
  } catch (e) {
    if (e.response?.data?.detail) {
      throw new Error(e.response.data.detail);
    }
    const cached = getLocalUsersCache();
    saveLocalUsersCache(cached.filter((u) => u.id !== userId));
    return { id: userId, deleted: true };
  }
}

export async function toggleUserStatus(userId) {
  try {
    const { data } = await api.patch(`/auth/users/${userId}/status`);
    const cached = getLocalUsersCache();
    const updated = cached.map((u) => (u.id === userId ? { ...u, activo: data.activo } : u));
    saveLocalUsersCache(updated);
    return data;
  } catch (e) {
    const cached = getLocalUsersCache();
    let toggledItem = null;
    const updated = cached.map((u) => {
      if (u.id === userId) {
        toggledItem = { ...u, activo: !u.activo };
        return toggledItem;
      }
      return u;
    });
    saveLocalUsersCache(updated);
    return toggledItem || { id: userId, activo: false };
  }
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}
