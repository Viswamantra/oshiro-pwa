import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoleSelect from "./pages/RoleSelect";
import CustomerLogin from "./pages/CustomerLogin";
import MerchantLogin from "./pages/MerchantLogin";
import AdminLogin from "./pages/AdminLogin";

import HomeScreen from "./pages/HomeScreen";
import MerchantDashboard from "./pages/MerchantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Step 1: Ask User Role */}
        <Route path="/" element={<RoleSelect />} />

        {/* Logins */}
        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/merchant-login" element={<MerchantLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* After login */}
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/merchant" element={<MerchantDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
