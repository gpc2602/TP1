import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import HeatMap from "./pages/HeatMap";

const Dashboard = lazy(() => import("./components/Dashboard"));
const SHAPAnalysis = lazy(() => import("./components/SHAPAnalysis"));
const PatrolSimulator = lazy(() => import("./components/PatrolSimulator"));
const AlertSystem = lazy(() => import("./components/AlertSystem"));
const ConfigPanel = lazy(() => import("./components/ConfigPanel"));
const ReportGenerator = lazy(() => import("./components/ReportGenerator"));
const AuditLogs = lazy(() => import("./components/AuditLogs"));
const SystemStatus = lazy(() => import("./components/SystemStatus"));
const Settings = lazy(() => import("./components/Settings"));
const UsersManagement = lazy(() => import("./components/UsersManagement"));

function ModuleFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-[#060D1A]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-blue-600/20 border-t-blue-600 animate-spin"
        />
        <span className="font-mono text-xs text-base-muted">CARGANDO MÓDULO...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Mapa de Calor - Todos los roles */}
            <Route index element={<HeatMap />} />

            {/* Dashboard Operativo - Admin, Supervisor, Analista */}
            <Route
              path="operativo"
              element={
                <ProtectedRoute allowedRoles={["administrador", "supervisor", "analista"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <Dashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Análisis IA SHAP - Admin, Analista */}
            <Route
              path="ia"
              element={
                <ProtectedRoute allowedRoles={["administrador", "analista"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <SHAPAnalysis />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Simulador de Patrullaje - Admin, Supervisor */}
            <Route
              path="simulador"
              element={
                <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <PatrolSimulator />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Sistema de Alertas - Todos los roles */}
            <Route
              path="alertas"
              element={
                <Suspense fallback={<ModuleFallback />}>
                  <AlertSystem />
                </Suspense>
              }
            />

            {/* Generador de Reportes - Admin, Supervisor, Analista */}
            <Route
              path="reportes"
              element={
                <ProtectedRoute allowedRoles={["administrador", "supervisor", "analista"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <ReportGenerator />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Logs de Auditoría - Solo Administrador */}
            <Route
              path="auditoria"
              element={
                <ProtectedRoute allowedRoles={["administrador"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <AuditLogs />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Estado del Sistema - Admin, Supervisor */}
            <Route
              path="estado"
              element={
                <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <SystemStatus />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Configuración - Solo Administrador */}
            <Route
              path="configuracion"
              element={
                <ProtectedRoute allowedRoles={["administrador"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <ConfigPanel />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Ajustes de Sistema - Solo Administrador */}
            <Route
              path="ajustes"
              element={
                <ProtectedRoute allowedRoles={["administrador"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Gestión de Usuarios y Roles (RBAC) - Admin y Supervisor */}
            <Route
              path="usuarios"
              element={
                <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
                  <Suspense fallback={<ModuleFallback />}>
                    <UsersManagement />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
