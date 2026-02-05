import React, { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/index.js";

/**
 * =========================================================
 * ADMIN DASHBOARD
 * ---------------------------------------------------------
 * ✔ Safe Firebase import
 * ✔ Does NOT break AdminLayout
 * ✔ Clean stat cards
 * ✔ Vercel safe
 * =========================================================
 */

export default function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    merchantsPending: 0,
    merchantsApproved: 0,
    categories: 0,
    offers: 0,
  });

  const [loading, setLoading] = useState(true);

  /* ======================
     LOAD DASHBOARD STATS
  ====================== */
  const loadStats = async () => {
    try {
      setLoading(true);

      const [
        customersSnap,
        categoriesSnap,
        offersSnap,
        merchantsPendingSnap,
        merchantsApprovedSnap,
      ] = await Promise.all([
        getCountFromServer(collection(db, "customers")),
        getCountFromServer(collection(db, "categories")),
        getCountFromServer(collection(db, "offers")),
        getCountFromServer(
          query(collection(db, "merchants"), where("status", "==", "pending"))
        ),
        getCountFromServer(
          query(collection(db, "merchants"), where("status", "==", "approved"))
        ),
      ]);

      setStats({
        customers: customersSnap.data().count,
        categories: categoriesSnap.data().count,
        offers: offersSnap.data().count,
        merchantsPending: merchantsPendingSnap.data().count,
        merchantsApproved: merchantsApprovedSnap.data().count,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <div>Loading dashboard…</div>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>

      {/* ======================
          STAT CARDS
      ====================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <StatCard title="Customers" value={stats.customers} color="#1976d2" />
        <StatCard
          title="Merchants Pending"
          value={stats.merchantsPending}
          color="#f57c00"
        />
        <StatCard
          title="Merchants Approved"
          value={stats.merchantsApproved}
          color="#2e7d32"
        />
        <StatCard title="Categories" value={stats.categories} color="#6a1b9a" />
        <StatCard title="Offers" value={stats.offers} color="#c62828" />
      </div>

      {/* ======================
          QUICK ACTIONS
      ====================== */}
      <div style={{ marginTop: 32 }}>
        <h3>Quick Actions</h3>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Approve pending merchants</li>
          <li>Create / manage categories</li>
          <li>Monitor Geo alerts</li>
          <li>Send notifications</li>
        </ul>
      </div>
    </div>
  );
}

/* ======================
   STAT CARD
====================== */
function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 8,
        padding: 20,
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 14, color: "#555" }}>{title}</div>
      <div
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color,
          marginTop: 8,
        }}
      >
        {value}
      </div>
    </div>
  );
}
