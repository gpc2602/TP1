import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="h-screen flex bg-base-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
