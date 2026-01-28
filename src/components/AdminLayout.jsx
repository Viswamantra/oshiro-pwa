import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AdminLayout() {
  return (
    <div className="admin-wrapper">
      <Sidebar />

      <div className="admin-main">
        <header className="admin-header">
          <h3>Admin Panel</h3>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
