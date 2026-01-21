import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

const PAGE_SIZE = 10;

/* ======================
   UI CONSTANTS
====================== */
const STATUS_COLORS = {
  pending: "#F59E0B",
  approved: "#16A34A",
  rejected: "#DC2626",
};

const pillStyle = (active, color) => ({
  padding: "6px 16px",
  borderRadius: 999,
  border: `1px solid ${color}`,
  background: active ? color : "transparent",
  color: active ? "#fff" : color,
  cursor: "pointer",
  fontWeight: 500,
});

export default function Merchants() {
  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD MERCHANTS
  ====================== */
  const loadMerchants = async (reset = false) => {
    try {
      setLoading(true);

      let q = query(
        collection(db, "merchants"),
        orderBy("mobile"),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDoc) {
        q = query(
          collection(db, "merchants"),
          orderBy("mobile"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === status);

      setMerchants(reset ? data : [...merchants, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
      alert("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMerchants([]);
    setLastDoc(null);
    loadMerchants(true);
    // eslint-disable-next-line
  }, [status]);

  /* ======================
     SEARCH
  ====================== */
  const searchMerchants = async () => {
    if (!search.trim()) {
      setMerchants([]);
      setLastDoc(null);
      loadMerchants(true);
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "merchants"),
        orderBy("mobile"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (m) =>
            m.status === status &&
            m.mobile &&
            m.mobile.startsWith(search)
        );

      setMerchants(data);
      setHasMore(false);
    } catch (err) {
      console.error(err);
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     ACTIONS
  ====================== */
  const approveMerchant = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: serverTimestamp(),
    });
    setMerchants(merchants.filter((m) => m.id !== id));
  };

  const rejectMerchant = async (id) => {
    if (!window.confirm("Reject this merchant?")) return;

    await updateDoc(doc(db, "merchants", id), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
    });
    setMerchants(merchants.filter((m) => m.id !== id));
  };

  const deleteMerchant = async (id) => {
    if (!window.confirm("Delete merchant permanently?")) return;

    await deleteDoc(doc(db, "merchants", id));
    setMerchants(merchants.filter((m) => m.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <h2 style={{ fontSize: 20, marginBottom: 6 }}>
        Merchants
      </h2>
      <p style={{ color: "#6B7280", marginBottom: 20 }}>
        Review and manage merchant onboarding
      </p>

      {/* STATUS FILTER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            style={pillStyle(status === s, STATUS_COLORS[s])}
            onClick={() => setStatus(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search by mobile number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 10,
            width: 260,
            borderRadius: 8,
            border: "1px solid #E5E7EB",
          }}
        />
        <button onClick={searchMerchants}>Search</button>
        <button
          onClick={() => {
            setSearch("");
            setMerchants([]);
            setLastDoc(null);
            loadMerchants(true);
          }}
        >
          Reset
        </button>
      </div>

      {/* TABLE CARD */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table width="100%" cellPadding="14">
          <thead style={{ background: "#F9FAFB" }}>
            <tr style={{ textAlign: "left", fontSize: 14 }}>
              <th>Merchant</th>
              <th>Mobile</th>
              <th>Status</th>
              <th style={{ width: 240 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {merchants.map((m) => (
              <tr
                key={m.id}
                style={{ borderTop: "1px solid #E5E7EB" }}
              >
                <td>
                  <strong>{m.name || "—"}</strong>
                </td>

                <td>{m.mobile}</td>

                <td>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background:
                        STATUS_COLORS[m.status] + "22",
                      color: STATUS_COLORS[m.status],
                      fontSize: 12,
                      fontWeight: 600,
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
                        style={{
                          marginRight: 8,
                          background: "#16A34A",
                          color: "#fff",
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "none",
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectMerchant(m.id)}
                        style={{
                          background: "#DC2626",
                          color: "#fff",
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "none",
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => deleteMerchant(m.id)}
                      style={{
                        background: "#FEE2E2",
                        color: "#991B1B",
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid #FCA5A5",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {merchants.length === 0 && !loading && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "#6B7280",
            }}
          >
            No merchants found
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {hasMore && (
        <div style={{ marginTop: 20 }}>
          <button disabled={loading} onClick={() => loadMerchants(false)}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
