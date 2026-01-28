
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24, background: "#f7f7f7" }}>
        <Outlet />
      </main>
    </div>
  );
}
