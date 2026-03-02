import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";

/**
 * =========================================================
 * ADMIN → MERCHANTS (AUTH SAFE + RULE SAFE)
 * ---------------------------------------------------------
 * ✔ Waits for auth state
 * ✔ No race condition
 * ✔ Works with admin role rules
 * ✔ No aggregation
 * ✔ Stable production build
 * =========================================================
 */

const STATUS_COLORS = {
  approved: "#16A34A",
  pending: "#F59E0B",
  rejected: "#DC2626",
};

const STATUS_BG = {
  approved: "#DCFCE7",
  pending: "#FEF3C7",
  rejected: "#FEE2E2",
};

export default function Merchants() {
  const auth = getAuth();

  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("approved");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  /* ================= WAIT FOR AUTH ================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthReady(true);
      } else {
        setAuthReady(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* ================= LOAD MERCHANTS ================= */

  const loadMerchants = async () => {
    try {
      if (!auth.currentUser) return;

      setLoading(true);

      // ensure fresh token
      await auth.currentUser.getIdToken(true);

      const q = query(
        collection(db, "merchants"),
        where("status", "==", status)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setMerchants(data);
    } catch (err) {
      console.error("LOAD MERCHANT ERROR:", err);
      alert("Load failed → " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= RELOAD WHEN STATUS CHANGES ================= */

  useEffect(() => {
    if (authReady) {
      loadMerchants();
    }
  }, [status, authReady]);

  /* ================= APPROVE ================= */

  const approveMerchant = async (id) => {
    try {
      setActionLoading(id);

      await auth.currentUser.getIdToken(true);

      await updateDoc(doc(db, "merchants", id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      loadMerchants();
    } catch (err) {
      console.error("APPROVE ERROR:", err);
      alert("Approve failed → " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= REJECT ================= */

  const rejectMerchant = async (id) => {
    try {
      setActionLoading(id);

      await auth.currentUser.getIdToken(true);

      await updateDoc(doc(db, "merchants", id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      loadMerchants();
    } catch (err) {
      console.error("REJECT ERROR:", err);
      alert("Reject failed → " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= DELETE ================= */

  const deleteMerchant = async (id) => {
    if (!window.confirm("Delete merchant permanently?")) return;

    try {
      setActionLoading(id);

      await auth.currentUser.getIdToken(true);

      await deleteDoc(doc(db, "merchants", id));

      loadMerchants();
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Delete failed → " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22 }}>Merchants</h2>

      {/* STATUS FILTER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["approved", "pending", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              border: `1px solid ${STATUS_COLORS[s]}`,
              background: status === s ? STATUS_COLORS[s] : "#fff",
              color: status === s ? "#fff" : STATUS_COLORS[s],
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && <div>Loading...</div>}

      {!loading && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #E5E7EB",
          }}
        >
          <table width="100%" cellPadding="14">
            <thead style={{ background: "#F9FAFB" }}>
              <tr>
                <th>Shop Name</th>
                <th>Category</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {merchants.map((m) => (
                <tr key={m.id}>
                  <td>{m.shopName || m.shop_name}</td>
                  <td>{m.category}</td>
                  <td>{m.mobile}</td>
                  <td>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: STATUS_BG[m.status],
                        color: STATUS_COLORS[m.status],
                      }}
                    >
                      {m.status}
                    </span>
                  </td>

                  <td>
                    {status === "pending" ? (
                      <>
                        <button
                          onClick={() => approveMerchant(m.id)}
                          disabled={actionLoading === m.id}
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectMerchant(m.id)}
                          disabled={actionLoading === m.id}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => deleteMerchant(m.id)}
                        disabled={actionLoading === m.id}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {merchants.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No merchants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}