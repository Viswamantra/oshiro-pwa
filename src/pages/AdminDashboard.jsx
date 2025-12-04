// src/pages/AdminDashboard.jsx

import { useEffect, useState } from "react";
import LogoutBtn from "../components/LogoutBtn";

import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AdminDashboard() {
  const ADMIN_MOBILE = "7386361725";
  const role = localStorage.getItem("logged_role");
  const mobile = localStorage.getItem("mobile");

  const [merchants, setMerchants] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ------------------------------------
  // STRICT ACCESS VALIDATION
  // ------------------------------------
  useEffect(() => {
    if (role !== "admin" || mobile !== ADMIN_MOBILE) {
      alert("Admin Access Denied!");
      window.location.href = "/";
      return;
    }

    loadData();
  }, []);

  // ------------------------------------
  // Get all merchants & customers
  // ------------------------------------
  async function loadData() {
    setLoading(true);

    // Fetch merchants
    const merchantSnap = await getDocs(collection(db, "merchants"));
    const merchantList = merchantSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Fetch customers
    // NOTE: If "customers" collection doesn't exist, this returns empty safely.
    const customerSnap = await getDocs(collection(db, "customers"));
    const customerList = customerSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setMerchants(merchantList);
    setCustomers(customerList);

    setLoading(false);
  }

  if (loading)
    return (
      <div style={{ padding: 20 }}>
        <h3>Loading Admin Data...</h3>
      </div>
    );

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <LogoutBtn />

      {/* HEADER */}
      <h2>Admin Dashboard</h2>
      <p>
        Logged in as Admin: <b>{mobile}</b>
      </p>

      <button
        onClick={loadData}
        style={{
          padding: "6px 12px",
          background: "#007AFF",
          border: "none",
          fontSize: 14,
          borderRadius: 6,
          color: "#fff",
          cursor: "pointer",
          marginBottom: 18,
        }}
      >
        🔄 Refresh Data
      </button>

      {/* CUSTOMERS LIST */}
      <section style={{ marginTop: 20 }}>
        <h3>Customer Records</h3>

        {!customers.length && <p>No customer records found</p>}

        {customers.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              borderRadius: 8,
              marginBottom: 8,
              background: "#f9f9f9",
            }}
          >
            <b>Mobile:</b> {c.mobile} <br />
            {c.name && (
              <>
                <b>Name:</b> {c.name}
                <br />
              </>
            )}
            {c.joinedAt && (
              <small>Joined: {new Date(c.joinedAt).toLocaleString()}</small>
            )}
          </div>
        ))}
      </section>

      <hr style={{ margin: "25px 0" }} />

      {/* MERCHANT LIST */}
      <section>
        <h3>Merchant Records</h3>

        {!merchants.length && <p>No merchant records found</p>}

        {merchants.map((m) => (
          <div
            key={m.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <h4 style={{ margin: 0 }}>{m.shopName || "Unnamed Shop"}</h4>
            <small>ID: {m.id}</small>
            <br />
            <b>Mobile:</b> {m.mobile}
            <br />
            <b>Category:</b> {m.category || "Not Set"}
            <br />

            <b>Geofence Radius:</b> {m.radius ? `${m.radius} m` : "N/A"}
            <br />

            {m.offerTitle && (
              <>
                <b>Offer:</b> {m.offerTitle} <br />
              </>
            )}

            {m.offerDesc && <small>{m.offerDesc}</small>}

            <br />
            <br />

            <b>Address:</b>
            <div>{m.address}</div>

            <div>
              {m.city}, {m.state} - {m.pincode}
            </div>

            {m.lat && m.lng && (
              <div style={{ marginTop: 6, fontSize: 13, color: "#333" }}>
                <b>Coordinates: </b>
                Lat: {m.lat}, Lng: {m.lng}
              </div>
            )}

            <div style={{ marginTop: 6 }}>
              <b>Created:</b>{" "}
              {m.createdAt
                ? new Date(m.createdAt.seconds * 1000).toLocaleString()
                : "Not Recorded"}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
