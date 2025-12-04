// src/components/LogoutBtn.jsx

export default function LogoutBtn() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "8px 14px",
        background: "#ff4d4d",
        color: "#fff",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600",
        marginBottom: "12px",
      }}
    >
      Logout
    </button>
  );
}
