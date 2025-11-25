import { useState, useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

export default function NotificationPanel() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission denied");
        return;
      }

      const fcmToken = await getToken(messaging, {
        vapidKey: "BB9KB-W0ATzZVQ9maQa4K5N6YvoM-ijK9FP0v-lF_vgFasPRL-3twJ8u9fomV3saPkFTY_Iz6QtfJOEnLFXwhQk",
      });

      if (!fcmToken) {
        setError("No FCM token generated");
        return;
      }

      setToken(fcmToken);
      console.log("FCM Token:", fcmToken);
    } catch (err) {
      setError("Error getting token: " + err.message);
    }
  };

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);
      alert("Notification: " + payload.notification.title);
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Enable Notifications</h2>

      <button
        onClick={requestPermission}
        style={{
          padding: "10px 20px",
          background: "#0084ff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        Get Notification Token
      </button>

      {token && (
        <>
          <h3>Your FCM Token:</h3>
          <textarea
            value={token}
            readOnly
            style={{ width: "100%", height: "150px" }}
          />
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
