// src/pages/AdminDashboard.jsx

function AdminDashboard() {
  const mobile = localStorage.getItem("mobile");
  const role = localStorage.getItem("role");

  if (mobile !== "7386361725" || role !== "admin") {
    return <h3>Access Denied</h3>;
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Admin Dashboard</h2>
      <p>Logged in as Admin: <b>{mobile}</b></p>

      <h3>Customer Records</h3>
      <p>Coming Soon...</p>

      <h3>Merchant Records</h3>
      <p>Coming Soon...</p>
    </div>
  );
}

export default AdminDashboard;
