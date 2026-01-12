import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * =========================================================
 * NOTIFICATION PERMISSION (CUSTOMER)
 * ---------------------------------------------------------
 * ✔ Mobile-first UX
 * ✔ One-time prompt
 * ✔ Polite & value-driven
 * =========================================================
 */

export default function NotificationPermission() {
  const navigate = useNavigate();

  const enableNotifications = async () => {
    try {
      if (!("Notification" in window)) {
        navigate("/customer");
        return;
      }

      const permission = await Notification.requestPermission();

      // Store decision (used later)
      localStorage.setItem(
        "notification_permission",
        permission
      );

      navigate("/customer");
    } catch (err) {
      console.error("Notification permission error:", err);
      navigate("/customer");
    }
  };

  const skip = () => {
    localStorage.setItem(
      "notification_permission",
      "skipped"
    );
    navigate("/customer");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🔔</div>

        <h2 style={styles.title}>
          Get Instant Offers Near You
        </h2>

        <p style={styles.text}>
          Enable notifications to receive
          exclusive offers from nearby shops
          when you are around them.
        </p>

        <ul style={styles.list}>
          <li>• Limited-time deals</li>
          <li>• No spam</li>
          <li>• Turn off anytime</li>
        </ul>

        <button
          style={styles.primary}
          onClick={enableNotifications}
        >
          Enable Notifications
        </button>

        <button
          style={styles.secondary}
          onClick={skip}
        >
          Not Now
        </button>
      </div>
    </div>
  );
}

/* ======================
   STYLES (MOBILE-FIRST)
====================== */
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#f9fafb",
  },
  card: {
    maxWidth: 360,
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  list: {
    textAlign: "left",
    fontSize: 14,
    color: "#444",
    marginBottom: 20,
    paddingLeft: 10,
  },
  primary: {
    width: "100%",
    padding: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
    marginBottom: 10,
  },
  secondary: {
    width: "100%",
    padding: 10,
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 14,
    cursor: "pointer",
  },
};
