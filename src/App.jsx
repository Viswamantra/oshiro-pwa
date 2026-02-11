import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

/* ========= FIREBASE MESSAGING ========= */
import {
  initMessaging,
  listenForegroundMessages,
  updateFCMToken,
} from "./firebase";

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

  /* ================= APP START FCM INIT + TOKEN REFRESH ================= */
  useEffect(() => {

    const startMessaging = async () => {

      try {

        console.log("🚀 App Start → Init Messaging");

        /* INIT MESSAGING */
        await initMessaging();

        /* FOREGROUND LISTENER */
        listenForegroundMessages();

        console.log("✅ Messaging Initialized");

        /* ================= TOKEN REFRESH ON APP START ================= */

        const role = localStorage.getItem("activeRole");

        if (!role) {
          console.log("ℹ No active role found");
          return;
        }

        console.log("👤 Active Role:", role);

        /* CUSTOMER TOKEN REFRESH */
        if (role === "customer") {

          const mobile = localStorage.getItem("mobile");

          if (mobile) {

            console.log("📲 Refreshing Customer Token");

            await updateFCMToken({
              userId: mobile,
              role: "customers",
            });

            console.log("✅ Customer Token Synced");

          }

        }

        /* MERCHANT TOKEN REFRESH */
        if (role === "merchant") {

          const merchantStr = localStorage.getItem("merchant");

          if (merchantStr) {

            const merchant = JSON.parse(merchantStr);

            console.log("📲 Refreshing Merchant Token");

            await updateFCMToken({
              userId: merchant.id,
              role: "merchants",
            });

            console.log("✅ Merchant Token Synced");

          }

        }

        console.log("🎉 App Start Messaging Flow Complete");

      } catch (err) {

        console.log("⚠ App Start Messaging Error:", err);

      }

    };

    startMessaging();

  }, []);

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
