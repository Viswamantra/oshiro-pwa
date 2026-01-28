import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* ======================
   HOME
====================== */
import Home from "./pages/Home";

/* ======================
   AUTH
====================== */
import AdminLogin from "./pages/auth/AdminLogin";
import CustomerLogin from "./pages/customer/CustomerLogin";
import MerchantLogin from "./pages/merchant/MerchantLogin";
import MerchantRegister from "./pages/merchant/MerchantRegister";

/* ======================
   LAYOUTS
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

export default function App() {
  return (
    <Routes>
      {/* ======================
          PUBLIC
      ====================== */}
      <Route path="/" element={<Home />} />

      {/* ======================
          AUTH
      ====================== */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/merchant/login" element={<MerchantLogin />} />
      <Route path="/merchant/register" element={<MerchantRegister />} />

      {/* ======================
          ADMIN (PROTECTED + LAYOUT)
      ====================== */}
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="merchants" element={<Merchants />} />
          <Route path="merchant-approval" element={<MerchantApproval />} />
          <Route path="categories" element={<Categories />} />
          <Route path="offers" element={<Offers />} />
          <Route path="geo-alerts" element={<GeoAlerts />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      {/* ======================
          CUSTOMER (PROTECTED + LAYOUT)
      ====================== */}
      <Route element={<ProtectedRoute customerOnly />}>
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="merchant/:merchantId" element={<MerchantDetails />} />
          <Route path="nearby-offers" element={<NearbyOffers />} />
          <Route
            path="notifications"
            element={<NotificationPermission />}
          />
        </Route>
      </Route>

      {/* ======================
          MERCHANT (PROTECTED + LAYOUT)
      ====================== */}
      <Route element={<ProtectedRoute merchantOnly />}>
        <Route path="/merchant" element={<MerchantLayout />}>
          <Route index element={<MerchantDashboard />} />
          <Route path="offers" element={<MerchantOffers />} />
          <Route path="profile" element={<MerchantProfile />} />
          <Route path="location" element={<MerchantLocation />} />
        </Route>
      </Route>

      {/* ======================
          FALLBACK
      ====================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
