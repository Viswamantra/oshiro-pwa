import { Routes, Route, Navigate } from "react-router-dom";

/* ========= CONFIG ========= */
import { APP_CONFIG } from "./config/appConfig";

/* ========= HOME ========= */
import Home from "./pages/Home.jsx";

/* ========= AUTH (PUBLIC) ========= */
import AdminLogin from "./pages/auth/AdminLogin.jsx";
import CustomerLogin from "./pages/customer/CustomerLogin.jsx";
import MerchantLogin from "./pages/merchant/MerchantLogin.jsx";
import MerchantRegister from "./pages/merchant/MerchantRegister.jsx";

/* ========= ROUTE GUARD ========= */
import RouteGuard from "./guards/RouteGuard.jsx";

/* ========= ADMIN ========= */
import AdminLayout from "./components/AdminLayout.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import Customers from "./pages/admin/Customers.jsx";
import Merchants from "./pages/admin/Merchants.jsx";
import Categories from "./pages/admin/Categories.jsx";
import Offers from "./pages/admin/Offers.jsx";
import GeoAlerts from "./pages/admin/GeoAlerts.jsx";
import Notifications from "./pages/admin/Notifications.jsx";

/* ========= CUSTOMER ========= */
import CustomerLayout from "./components/CustomerLayout.jsx";
import CustomerDashboard from "./pages/customer/CustomerDashboard.jsx";
import OfferDetails from "./pages/customer/OfferDetails.jsx";
import CustomerLocked from "./pages/customer/CustomerLocked.jsx";

/* ========= MERCHANT ========= */
import MerchantLayout from "./components/MerchantLayout.jsx";
import MerchantDashboard from "./pages/merchant/MerchantDashboard.jsx";
import MerchantOffers from "./pages/merchant/MerchantOffers.jsx";
import MerchantProfile from "./pages/merchant/MerchantProfile.jsx";
import MerchantLeads from "./pages/merchant/MerchantLeads.jsx";
import MerchantLocation from "./pages/merchant/MerchantLocation.jsx";

export default function App() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<Home />} />

      {/* ================= AUTH ================= */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route path="/merchant/register" element={<MerchantRegister />} />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <RouteGuard allowedRoles={["admin"]}>
            <AdminLayout />
          </RouteGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="merchants" element={<Merchants />} />
        <Route path="categories" element={<Categories />} />
        <Route path="offers" element={<Offers />} />
        <Route path="geo-alerts" element={<GeoAlerts />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ================= CUSTOMER ================= */}
      <Route
        path="/customer/*"
        element={
          APP_CONFIG.CUSTOMER_ENABLED ? (
            <RouteGuard allowedRoles={["customer"]}>
              <CustomerLayout />
            </RouteGuard>
          ) : (
            <CustomerLocked />
          )
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="offers/:merchantId" element={<OfferDetails />} />
      </Route>

      {/* ================= MERCHANT ================= */}
      <Route
        path="/merchant"
        element={
          <RouteGuard allowedRoles={["merchant"]}>
            <MerchantLayout />
          </RouteGuard>
        }
      >
        <Route index element={<MerchantDashboard />} />
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="location" element={<MerchantLocation />} />
        <Route path="offers" element={<MerchantOffers />} />
        <Route path="profile" element={<MerchantProfile />} />
        <Route path="leads" element={<MerchantLeads />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
