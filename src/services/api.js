import axios from "axios";

// Configuración de la URL base del backend FastAPI (puerto 8001 en desarrollo local)
const BASE_URL = import.meta.env.VITE_API_URL || "https://tp1-l07m.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// El token se guarda en memoria (no en localStorage) para evitar
// exponerlo a ataques XSS, según buenas prácticas de manejo de JWT.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Si el backend responde 401, el token expiró o es inválido:
// limpiamos sesión para forzar login de nuevo.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken(null);
    }
    return Promise.reject(error);
  }
);

export default api;
