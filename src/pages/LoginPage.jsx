import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../auth/Login.jsx";

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect correctly
    const role = localStorage.getItem("oshiro_role");
    if (role === "merchant") navigate("/merchant");
    if (role === "customer") navigate("/customer");
    if (role === "admin") navigate("/admin");
  }, [navigate]);

  return <Login />;
}
