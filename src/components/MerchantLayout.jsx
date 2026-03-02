import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { clearActiveRole } from "../utils/activeRole";

/**
 * =========================================================
 * MERCHANT LAYOUT – UID BASED (FINAL CLEAN VERSION)
 * ---------------------------------------------------------
 * ✔ No localStorage merchant object
 * ✔ Firebase UID is single source of truth
 * ✔ Fetches merchant document safely
 * ✔ Approval badge supported
 * ✔ Clean logout
 * =========================================================
 */

export default function MerchantLayout() {
  const navigate = useNavigate();

  const [uid, setUid] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  /* ======================
     AUTH LISTENER
  ====================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  /* ======================
     FETCH MERCHANT DOC
  ====================== */
  useEffect(() => {
    if (!uid) return;

    const fetchMerchant = async () => {
      try {
        const snap = await getDoc(doc(db, "merchants", uid));
        if (snap.exists()) {
          setMerchant(snap.data());
        }
      } catch (err) {
        console.error("Failed to fetch merchant:", err);
      }
    };

    fetchMerchant();
  }, [uid]);

  /* ======================
     LOGOUT
  ====================== */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Signout error:", err);
    }

    clearActiveRole();
    window.location.replace("/");
  };

  if (!authReady) return null;

  const isApproved = merchant?.status === "approved";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ======================
          HEADER
      ====================== */}
      <header
        style={{
          padding: 12,
          background: "#1976d2",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>
          Merchant Panel
          {merchant?.shopName ? ` – ${merchant.shopName}` : ""}
          {!isApproved && merchant && (
            <span style={{ fontSize: 12, marginLeft: 8 }}>
              (Pending Approval)
            </span>
          )}
        </strong>

        <button onClick={logout}>Logout</button>
      </header>

      {/* ======================
          NAVIGATION
      ====================== */}
      <nav
        style={{
          display: "flex",
          gap: 16,
          padding: 12,
          background: "#f5f5f5",
        }}
      >
        <NavLink to="." end style={linkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="offers" style={linkStyle}>
          Offers
        </NavLink>

        <NavLink to="profile" style={linkStyle}>
          Profile
        </NavLink>

        <NavLink to="location" style={linkStyle}>
          Location
        </NavLink>

        <NavLink to="leads" style={linkStyle}>
          Leads
        </NavLink>
      </nav>

      {/* ======================
          CONTENT
      ====================== */}
      <main style={{ padding: 20, flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

/* ======================
   LINK STYLES
====================== */
const linkStyle = ({ isActive }) => ({
  textDecoration: "none",
  fontWeight: isActive ? "bold" : "normal",
  color: isActive ? "#1976d2" : "#333",
});