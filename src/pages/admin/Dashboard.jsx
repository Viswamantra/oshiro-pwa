import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * ADMIN DASHBOARD (FINAL STABLE - NO AGGREGATION QUERIES)
 * ---------------------------------------------------------
 * ✔ No getCountFromServer
 * ✔ No RunAggregationQuery
 * ✔ Works with role-based Firestore rules
 * ✔ 100% safe for production
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
        getDocs(collection(db, "customers")),
        getDocs(collection(db, "categories")),
        getDocs(collection(db, "offers")),
        getDocs(
          query(collection(db, "merchants"), where("status", "==", "pending"))
        ),
        getDocs(
          query(collection(db, "merchants"), where("status", "==", "approved"))
        ),
      ]);

      setStats({
        customers: customersSnap.size,
        categories: categoriesSnap.size,
        offers: offersSnap.size,
        merchantsPending: merchantsPendingSnap.size,
        merchantsApproved: merchantsApprovedSnap.size,
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
    return <div style={{ padding: 20 }}>Loading dashboard…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
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
   STAT CARD COMPONENT
====================== */
function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 10,
        padding: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
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