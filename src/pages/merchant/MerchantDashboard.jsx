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
 * ✔ UX-safe permission handling
 * =========================================================
 */

export default function MerchantDashboard() {
  const merchantId = localStorage.getItem("merchantId");

  const [notificationStatus, setNotificationStatus] = useState(
    Notification?.permission || "default"
  );

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

    await enablePushNotifications(merchantId);
    setNotificationStatus(Notification.permission);
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
