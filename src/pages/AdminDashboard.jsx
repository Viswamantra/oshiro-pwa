import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin_logged_in");
    if (!isAdmin) {
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ padding: 40 }}>
      <h1>✅ Admin Dashboard Loaded</h1>
      <p>If you see this, routing is working.</p>
    </div>
  );
}
