import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { auth, db, functions } from "../../firebase";
import { generateAndSaveToken } from "../../services/fcmToken";
import { fetchMerchantStats } from "../../firebase/merchantStats";

export default function MerchantDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [merchantDoc, setMerchantDoc] = useState(null);
  const [fcmDoc, setFcmDoc] = useState(null);
  const [stats, setStats] = useState(null);

  const [notificationStatus, setNotificationStatus] = useState(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  /* ================= MERCHANT DOC ================= */
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "merchants", user.uid), (snap) => {
      if (snap.exists()) setMerchantDoc(snap.data());
    });

    return () => unsub();
  }, [user]);

  /* ================= FCM DOC ================= */
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, "fcmTokens", user.uid), (snap) => {
      setFcmDoc(snap.exists() ? snap.data() : null);
    });

    return () => unsub();
  }, [user]);

  /* ================= LOAD STATS ================= */
  useEffect(() => {
    if (!user?.uid) return;

    async function loadStats() {
      const data = await fetchMerchantStats(user.uid);
      setStats(data);
    }

    loadStats();
  }, [user]);

  /* ================= AUTO TOKEN ================= */
  useEffect(() => {
    if (!user?.uid) return;
    if (Notification.permission === "granted") {
      generateAndSaveToken(user.uid, "merchant");
    }
  }, [user]);

  /* ================= ENABLE PUSH ================= */
  const handleEnableNotifications = async () => {
    try {
      await generateAndSaveToken(user.uid, "merchant");
      setNotificationStatus(Notification.permission);
      alert("Push enabled");
    } catch (err) {
      console.error(err);
      alert("Push setup failed");
    }
  };

  /* ================= SEND TEST DEAL ================= */
  const handleSendTestDeal = async () => {
    if (!user?.uid) {
      alert("Merchant not logged in");
      return;
    }

    let phone = prompt("Enter 10-digit Customer Phone (without +91)");
    if (!phone) return;

    phone = phone.replace(/\D/g, "").slice(0, 10);

    if (phone.length !== 10) {
      alert("Phone must be exactly 10 digits");
      return;
    }

    const formattedPhone = "+91" + phone;

    try {
      const sendDeal = httpsCallable(functions, "sendInstantDeal");

      const res = await sendDeal({
        merchantId: user.uid,
        customerPhone: formattedPhone,
        title: "Special Offer Just For You",
        body: "You are near the shop — visit now!",
      });

      if (res.data?.success) {
        alert("Deal sent successfully!");
      } else {
        alert("Failed: " + (res.data?.reason || "unknown"));
      }
    } catch (err) {
      console.error("Callable error FULL:", err);
      alert("Error: " + (err.message || "Unknown error"));
    }
  };

  if (checkingAuth) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <p style={{ color: "red" }}>Merchant not logged in</p>
        <button onClick={() => navigate("/merchant/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{merchantDoc?.shopName || "Loading Shop..."}</h2>

      {/* ================= ANALYTICS ================= */}
      <div style={{ marginTop: 20, padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>📊 Merchant Analytics</h3>
        {!stats ? (
          <p>Loading stats...</p>
        ) : (
          <>
            <p>👁 Offer Views: <strong>{stats.offerViews || 0}</strong></p>
            <p>📞 Call Clicks: <strong>{stats.callClicks || 0}</strong></p>
            <p>💬 WhatsApp Clicks: <strong>{stats.whatsappClicks || 0}</strong></p>
            <p>📍 Direction Clicks: <strong>{stats.directionClicks || 0}</strong></p>
          </>
        )}
      </div>

      {/* ================= PUSH STATUS ================= */}
      <div style={{ marginTop: 20 }}>
        <p>
          🔔 Push Status:{" "}
          <strong>
            {notificationStatus === "granted"
              ? "Enabled"
              : notificationStatus === "denied"
              ? "Blocked"
              : "Not Enabled"}
          </strong>
        </p>

        {notificationStatus !== "granted" && (
          <button onClick={handleEnableNotifications}>
            Enable Push Notifications
          </button>
        )}
      </div>

      {/* ================= TEST DEAL ================= */}
      <button onClick={handleSendTestDeal} style={{ marginTop: 20 }}>
        Send Test Deal To Customer
      </button>

      {/* ================= NAVIGATION ================= */}
      <ul style={{ marginTop: 20 }}>
        <li><Link to="offers">Manage Offers</Link></li>
        <li><Link to="profile">Shop Profile</Link></li>
        <li><Link to="location">Shop Location</Link></li>
      </ul>
    </div>
  );
}