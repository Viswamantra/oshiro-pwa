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
  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("approved");
  const [search, setSearch] = useState("");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* DELETE MODAL STATE */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ======================
     LOAD MERCHANTS
  ====================== */
  const loadMerchants = async (reset = false) => {
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
    setLoading(false);
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
      resetSearch();
      return;
    }

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
          (
            (m.name &&
              m.name.toLowerCase().includes(search.toLowerCase())) ||
            (m.mobile && m.mobile.startsWith(search))
          )
      );

    setMerchants(data);
    setHasMore(false);
    setLoading(false);
  };

  const resetSearch = () => {
    setSearch("");
    setMerchants([]);
    setLastDoc(null);
    loadMerchants(true);
  };

  /* ======================
     DELETE ACTION
  ====================== */
  const confirmDelete = async () => {
    await deleteDoc(doc(db, "merchants", deleteTarget.id));
    setMerchants(merchants.filter((m) => m.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Merchants</h2>
      <p style={{ color: "#6B7280", marginBottom: 24 }}>
        Approved merchants are shown by default
      </p>

      {/* TABLE */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
      >
        <table width="100%" cellPadding="14">
          <thead style={{ background: "#F9FAFB" }}>
            <tr>
              <th align="left">Shop Name</th>
              <th align="left">Category</th>
              <th align="left">Mobile</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {merchants.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid #E5E7EB" }}>
                <td><strong>{m.name || "-"}</strong></td>
                <td>{m.category || "-"}</td>
                <td>{m.mobile}</td>
                <td>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: STATUS_BG[m.status],
                      color: STATUS_COLORS[m.status],
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {m.status}
                  </span>
                </td>
                <td>
                  {/* SAFE DELETE BUTTON */}
                  <button
                    onClick={() => setDeleteTarget(m)}
                    style={{
                      background: "#fff",
                      color: "#DC2626",
                      border: "1px solid #FCA5A5",
                      padding: "6px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LOAD MORE */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button
            disabled={loading}
            onClick={() => loadMerchants(false)}
            style={{
              padding: "12px 28px",
              borderRadius: 999,
              background: "#2563EB",
              color: "#fff",
              border: "none",
              fontWeight: 600,
            }}
          >
            Load More
          </button>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 14,
              width: 380,
            }}
          >
            <h3 style={{ marginBottom: 8, color: "#DC2626" }}>
              ⚠ Delete Merchant?
            </h3>
            <p style={{ color: "#6B7280", marginBottom: 16 }}>
              This action cannot be undone.
            </p>

            <div style={{ fontSize: 14, marginBottom: 20 }}>
              <strong>{deleteTarget.name || "-"}</strong><br />
              {deleteTarget.mobile}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #D1D5DB",
                  background: "#fff",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#DC2626",
                  color: "#fff",
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
