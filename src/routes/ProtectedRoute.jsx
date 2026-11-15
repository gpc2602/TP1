import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#060D1A]">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acceso No Autorizado</h2>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          Su rol institucional (<span className="text-amber-400 font-semibold uppercase">{user.role || user.rol}</span>) no cuenta con los permisos requeridos para acceder a este módulo según la matriz RBAC.
        </p>
        <a
          href="/dashboard"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Volver al Mapa de Calor
        </a>
      </div>
    );
  }

  return children;
}
