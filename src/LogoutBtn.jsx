// src/components/LogoutBtn.jsx
function LogoutBtn() {
  return (
    <button
      onClick={() => {
        localStorage.clear();
        window.location.href = "/";
      }}
      style={{
        background: "red",
        color: "white",
        padding: "6px 14px",
        borderRadius: "6px",
        border: "none",
        fontSize: "14px",
        cursor: "pointer",
        position: "absolute",
        top: "15px",
        right: "15px"
      }}
    >
      Logout
    </button>
  );
}

export default LogoutBtn;
