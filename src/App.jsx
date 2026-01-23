import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ======================
   HOME
====================== */
import Home from "./pages/Home";

/* ======================
   AUTH PAGES
====================== */
import AdminLogin from "./auth/AdminLogin";
import CustomerLogin from "./pages/customer/CustomerLogin";
import MerchantLogin from "./pages/merchant/MerchantLogin";
import MerchantRegister from "./pages/merchant/MerchantRegister";

/* ======================
   LAYOUTS & ROUTE GUARDS
====================== */
import AdminLayout from "./components/AdminLayout";
import CustomerLayout from "./components/CustomerLayout";
import MerchantLayout from "./components/MerchantLayout";
import ProtectedRoute from "./components/ProtectedRoute";

/* ======================
   ADMIN PAGES
====================== */
import Dashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import Merchants from "./pages/admin/Merchants";
import Categories from "./pages/admin/Categories";
import Offers from "./pages/admin/Offers";
import GeoAlerts from "./pages/admin/GeoAlerts";
import Notifications from "./pages/admin/Notifications";
import MerchantApproval from "./pages/admin/MerchantApproval";

/* ======================
   CUSTOMER PAGES
====================== */
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import NearbyOffers from "./pages/customer/NearbyOffers";
import MerchantDetails from "./pages/customer/MerchantDetails";
import NotificationPermission from "./pages/customer/NotificationPermission";

/* ======================
   MERCHANT PAGES
====================== */
import MerchantDashboard from "./pages/merchant/MerchantDashboard";
import MerchantOffers from "./pages/merchant/MerchantOffers";
import MerchantProfile from "./pages/merchant/MerchantProfile";
import MerchantLocation from "./pages/merchant/MerchantLocation";

/* ======================
   ONE-TIME MIGRATION
====================== */
import { migrateMerchants } from "./utils/migrateMerchants";

export default function App() {

  /* ======================
     ONE-TIME SCHEMA MIGRATION
     ⚠ REMOVE after running once
  ====================== */
  useEffect(() => {
    migrateMerchants()
      .then(() => console.log("✅ Merchant migration done"))
      .catch((err) =>
        console.error("❌ Merchant migration failed", err)
      );
  }, []);

  return (
    <Routes>
      {/* ======================
          HOME (PUBLIC)
      ====================== */}
      <Route path="/" element={<Home />} />

      {/* ======================
          AUTH ROUTES (PUBLIC)
      ====================== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route path="/merchant/register" element={<MerchantRegister />} />

      {/* ======================
          CUSTOMER NOTIFICATION PERMISSION
      ====================== */}
      <Route
        path="/customer/notifications"
        element={<NotificationPermission />}
      />

      {/* ======================
          ADMIN AREA (PROTECTED)
      ====================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="merchants" element={<Merchants />} />
        <Route path="merchant-approval" element={<MerchantApproval />} />
        <Route path="categories" element={<Categories />} />
        <Route path="offers" element={<Offers />} />
        <Route path="geo-alerts" element={<GeoAlerts />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* ======================
          CUSTOMER AREA (PROTECTED)
      ====================== */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute customerOnly>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route
          path="merchant/:merchantId"
          element={<MerchantDetails />}
        />
        <Route
          path="nearby-offers"
          element={<NearbyOffers />}
        />
      </Route>

      {/* ======================
          MERCHANT AREA (PROTECTED)
      ====================== */}
      <Route
        path="/merchant"
        element={
          <ProtectedRoute merchantOnly>
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MerchantDashboard />} />
        <Route path="offers" element={<MerchantOffers />} />
        <Route path="profile" element={<MerchantProfile />} />
        <Route path="location" element={<MerchantLocation />} />
      </Route>

      {/* ======================
          FALLBACK
      ====================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
