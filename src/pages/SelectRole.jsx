// src/pages/SelectRole.jsx

import { useNavigate } from "react-router-dom";

function SelectRole() {
  const navigate = useNavigate();
  const mobile = localStorage.getItem("mobile");

  function chooseRole(role) {
    localStorage.setItem("role", role);

    if (role === "admin") return navigate("/admin");
    if (role === "merchant") return navigate("/merchant");
    if (role === "customer") return navigate("/home");
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>Welcome to OshirO</h2>
      <p>Logged in as: <b>{mobile}</b></p>

      <h3>Select Your Role</h3>
      <button onClick={() => chooseRole("customer")}>Customer</button>
      <br /><br />
      <button onClick={() => chooseRole("merchant")}>Merchant</button>
      <br /><br />
      <button onClick={() => chooseRole("admin")}>Admin</button>
      <br /><br />

      <button
        style={{ marginTop: "20px", color: "red" }}
        onClick={() => {
          localStorage.clear();
          navigate("/");
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default SelectRole;
