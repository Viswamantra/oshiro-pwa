import React, { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

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

      const customersSnap = await getCountFromServer(
        collection(db, "customers")
      );

      const categoriesSnap = await getCountFromServer(
        collection(db, "categories")
      );

      const offersSnap = await getCountFromServer(
        collection(db, "offers")
      );

      const merchantsPendingSnap = await getCountFromServer(
        query(
          collection(db, "merchants"),
          where("status", "==", "pending")
        )
      );

      const merchantsApprovedSnap = await getCountFromServer(
        query(
          collection(db, "merchants"),
          where("status", "==", "approved")
        )
      );

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
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Dashboard</h2>

      {/* STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <StatCard
          title="Customers"
          value={stats.customers}
          color="#1976d2"
        />
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
        <StatCard
          title="Categories"
          value={stats.categories}
          color="#6a1b9a"
        />
        <StatCard
          title="Offers"
          value={stats.offers}
          color="#c62828"
        />
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginTop: 30 }}>
        <h3>Quick Actions</h3>
        <ul>
          <li>Approve pending merchants</li>
          <li>Create / manage categories</li>
          <li>Monitor Geo Alerts</li>
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
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 20,
        background: "#fff",
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
