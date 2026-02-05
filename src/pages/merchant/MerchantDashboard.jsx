import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * =========================================================
 * MERCHANT DASHBOARD (SAFE BOOT VERSION)
 * =========================================================
 */

export default function MerchantDashboard() {
  let merchantId = null;

  try {
    const stored = JSON.parse(localStorage.getItem("merchant"));
    merchantId = stored?.id || null;
  } catch (e) {
    merchantId = null;
  }

  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  /* ======================
     LOAD NOTIFICATION HELPERS LAZILY
  ====================== */
  useEffect(() => {
    if (!merchantId) return;
    if (!("Notification" in window)) return;

    import("../../firebase/notifications")
      .then(({ listenToForegroundMessages }) => {
        listenToForegroundMessages();
      })
      .catch((err) => {
        console.error("Notification init failed:", err);
      });
  }, [merchantId]);

  const handleEnableNotifications = async () => {
    if (!merchantId) {
      alert("Merchant not logged in");
      return;
    }

    try {
      const {
        enablePushNotifications,
        saveMerchantFcmToken,
      } = await import("../../firebase/notifications");

      const token = await enablePushNotifications(merchantId);

      if (token) {
        await saveMerchantFcmToken(merchantId, token);
      }

      setNotificationStatus(Notification.permission);
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
        {notificationStatus === "unsupported" && (
          <span style={{ color: "gray" }}>Not supported ❌</span>
        )}
        {notificationStatus === "default" && (
          <span style={{ color: "orange" }}>Not enabled ⚠️</span>
        )}

        {notificationStatus === "default" && (
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleEnableNotifications}>
              Enable Notifications
            </button>
          </div>
        )}
      </div>

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
