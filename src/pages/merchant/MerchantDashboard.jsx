import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  enablePushNotifications,
  listenToForegroundMessages,
} from "../../firebase/notifications";

/**
 * =========================================================
 * MERCHANT DASHBOARD
 * ---------------------------------------------------------
 * ✔ Navigation
 * ✔ Push notification enable flow
 * ✔ Foreground message listener
 * ✔ Safe merchant session handling
 * ✔ Rollup / Vercel safe
 * =========================================================
 */

export default function MerchantDashboard() {
  /* ======================
     GET MERCHANT SESSION
  ====================== */
  let merchantId = null;

  try {
    const stored = JSON.parse(localStorage.getItem("merchant"));
    merchantId = stored?.id || null;
  } catch (e) {
    merchantId = null;
  }

  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof Notification === "undefined") return "default";
    return Notification.permission;
  });

  /* ======================
     FOREGROUND LISTENER
  ====================== */
  useEffect(() => {
    listenToForegroundMessages();
  }, []);

  /* ======================
     ENABLE PUSH HANDLER
  ====================== */
  const handleEnableNotifications = async () => {
    if (!merchantId) {
      alert("Merchant not logged in");
      return;
    }

    try {
      await enablePushNotifications(merchantId);

      if (typeof Notification !== "undefined") {
        setNotificationStatus(Notification.permission);
      }
    } catch (err) {
      console.error("Enable notifications failed:", err);
      alert("Failed to enable notifications");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Merchant Dashboard</h2>

      {/* 🔔 NOTIFICATION STATUS */}
      <div
        style={{
          margin: "15px 0",
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          background: "#fafafa",
        }}
      >
        <strong>Push Notifications:</strong>{" "}
        {notificationStatus === "granted" && (
          <span style={{ color: "green" }}>Enabled ✅</span>
        )}
        {notificationStatus === "denied" && (
          <span style={{ color: "red" }}>Blocked ❌</span>
        )}
        {notificationStatus === "default" && (
          <span style={{ color: "orange" }}>Not enabled ⚠️</span>
        )}

        {notificationStatus !== "granted" && (
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleEnableNotifications}>
              Enable Notifications
            </button>
          </div>
        )}
      </div>

      {/* 📋 DASHBOARD LINKS */}
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
