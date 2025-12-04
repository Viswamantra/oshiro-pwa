import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomeScreen from "./pages/HomeScreen.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Login from "./pages/Login.jsx";
import SelectRole from "./pages/SelectRole.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Role Select */}
        <Route path="/select-role" element={<SelectRole />} />

        {/* Customer Side */}
        <Route path="/home" element={<HomeScreen />} />

        {/* Merchant Side */}
        <Route path="/merchant" element={<MerchantDashboard />} />

        {/* Admin Side */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
