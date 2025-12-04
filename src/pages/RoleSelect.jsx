import { useNavigate } from "react-router-dom";
import "./role.css";

export default function RoleSelect() {
  const nav = useNavigate();

  const chooseRole = (role) => {
    localStorage.setItem("user_role", role);
    if (role === "customer") nav("/customer-login");
    if (role === "merchant") nav("/merchant-login");
    if (role === "admin") nav("/admin-login");
  };

  return (
    <div className="role-box">
      <h2>Welcome to Oshiro</h2>
      <p>Select how you want to continue</p>

      <button onClick={() => chooseRole("customer")}>Customer</button>
      <button onClick={() => chooseRole("merchant")}>Merchant</button>
      <button onClick={() => chooseRole("admin")}>Admin</button>
    </div>
  );
}
