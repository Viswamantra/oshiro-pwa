import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

import { generateAndSaveToken } from "../../services/fcmToken";

/**
 * =========================================================
 * MERCHANT DASHBOARD — FINAL PUSH SAFE VERSION
 * =========================================================
 */

export default function MerchantDashboard() {

  let merchantId = null;

  try {
    const stored = JSON.parse(localStorage.getItem("merchant"));
    merchantId = stored?.id || null;
  } catch {
    merchantId = null;
  }

  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  const [liveMerchantDoc, setLiveMerchantDoc] = useState(null);

  /* =========================================================
     🔥 LIVE MERCHANT DOC DEBUG LISTENER
  ========================================================= */
  useEffect(() => {

    if (!merchantId) return;

    console.log("👀 Watching Merchant Doc:", merchantId);

    const unsub = onSnapshot(
      doc(db, "merchants", merchantId),
      (snap) => {
        const data = snap.data();
        console.log("🔥 LIVE MERCHANT DOC:", data);
        setLiveMerchantDoc(data);
      }
    );

    return () => unsub();

  }, [merchantId]);

  /* =========================================================
     🔔 AUTO TOKEN GENERATION ON DASHBOARD LOAD
  ========================================================= */
  useEffect(() => {

    if (!merchantId) return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      console.log("🔔 Permission already granted — refreshing token...");
      generateAndSaveToken(merchantId, "merchant");
    }

  }, [merchantId]);

  /* =========================================================
     🔔 ENABLE PUSH BUTTON
  ========================================================= */
  const handleEnableNotifications = async () => {

    if (!merchantId) {
      alert("Merchant not logged in");
      return;
    }

    try {

      await generateAndSaveToken(merchantId, "merchant");

      setNotificationStatus(Notification.permission);

    } catch (err) {
      console.error("Enable push failed:", err);
      alert("Push setup failed");
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div style={{ padding: 20 }}>

      <h2>Merchant Dashboard</h2>

      {/* 🔔 PUSH STATUS */}
      <div style={{
        margin: "15px 0",
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 6,
        background: "#fafafa"
      }}>

        <strong>Push Notifications:</strong>{" "}

        {notificationStatus === "granted" && (
          <span style={{ color: "green" }}>Enabled ✅</span>
        )}

        {notificationStatus === "denied" && (
          <span style={{ color: "red" }}>Blocked ❌</span>
        )}

        {notificationStatus === "unsupported" && (
          <span style={{ color: "gray" }}>Not supported ❌</span>
        )}

        {notificationStatus === "default" && (
          <span style={{ color: "orange" }}>Not enabled ⚠️</span>
        )}

        {notificationStatus === "default" && (
          <div style={{ marginTop: 10 }}>
            <button onClick={handleEnableNotifications}>
              Enable Notifications
            </button>
          </div>
        )}

      </div>

      {/* 🔥 DEBUG LIVE TOKEN VIEW */}
      {liveMerchantDoc && (
        <div style={{
          marginBottom: 20,
          padding: 12,
          border: "1px dashed #ccc"
        }}>
          <strong>Debug — Merchant Token:</strong>
          <pre style={{ fontSize: 12 }}>
            {JSON.stringify({
              fcmToken: liveMerchantDoc.fcmToken,
              fcmTokens: liveMerchantDoc.fcmTokens
            }, null, 2)}
          </pre>
        </div>
      )}

      <ul>
        <li>
          <Link to="offers">Manage Offers</Link>
        </li>
        <li>
          <Link to="profile">Shop Profile</Link>
        </li>
      </ul>

    </div>
  );
}
