import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginRequest,
  logout as logoutRequest,
  getCurrentUser,
} from "../services/auth";
import { setAccessToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("predictisafe_user");
      const savedToken = localStorage.getItem("predictisafe_token");
      if (savedUser && savedToken) {
        setAccessToken(savedToken);
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error al restaurar sesión:", e);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sincronizar token en axios si cambia de pestaña o al montar
  useEffect(() => {
    const token = localStorage.getItem("predictisafe_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginRequest(email, password);
      setUser(res.user);
      return true;
    } catch (err) {
      setError(
        err.message || "No se pudo iniciar sesión. Verifique sus credenciales institucionales."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    logoutRequest();
    setUser(null);
  }

  function hasRole(roles) {
    if (!user) return false;
    const current = (user.rol || user.role || "").toLowerCase();
    if (Array.isArray(roles)) {
      return roles.some((r) => r.toLowerCase() === current);
    }
    return roles.toLowerCase() === current;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasRole,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
