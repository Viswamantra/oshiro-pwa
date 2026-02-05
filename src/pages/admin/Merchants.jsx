/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Admin → Merchants
 * Bulk delete, filters, approvals are stable
 * Do NOT modify during Phase 2.7
 */

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
  /* ======================
     STATE
  ====================== */
  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("approved");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState([]);

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
      setSelected([]);
    } catch (err) {
      console.error("Load merchants error:", err);
      alert("Failed to load merchants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMerchants([]);
    setLastDoc(null);
    setSelected([]);
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

    try {
      setLoading(true);

      const q = query(
        collection(db, "merchants"),
        orderBy("mobile"),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      const keyword = search.toLowerCase();

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (m) =>
            m.status === status &&
            (
              (m.shop_name &&
                m.shop_name.toLowerCase().includes(keyword)) ||
              (m.mobile && m.mobile.startsWith(search))
            )
        );

      setMerchants(data);
      setHasMore(false);
      setSelected([]);
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearch("");
    setMerchants([]);
    setLastDoc(null);
    setSelected([]);
    loadMerchants(true);
  };

  /* ======================
     SELECTION
  ====================== */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === merchants.length) {
      setSelected([]);
    } else {
      setSelected(merchants.map((m) => m.id));
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
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;

    if (
      !window.confirm(
        `Delete ${selected.length} merchant(s) permanently?`
      )
    )
      return;

    await Promise.all(
      selected.map((id) => deleteDoc(doc(db, "merchants", id)))
    );

    setMerchants((prev) =>
      prev.filter((m) => !selected.includes(m.id))
    );
    setSelected([]);
  };

  /* ======================
     UI
  ====================== */
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Merchants</h2>
      <p style={{ color: "#6B7280", marginBottom: 20 }}>
        Approved merchants are shown by default
      </p>

      {/* STATUS TABS */}
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
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 16,
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          marginBottom: 16,
          maxWidth: 560,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shop name or mobile number"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #D1D5DB",
          }}
        />
        <button
          onClick={searchMerchants}
          style={{
            background: "#2563EB",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            fontWeight: 600,
          }}
        >
          Search
        </button>
        <button
          onClick={resetSearch}
          style={{
            background: "#fff",
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #D1D5DB",
          }}
        >
          Reset
        </button>
      </div>

      {/* BULK DELETE */}
      {selected.length > 0 && status !== "pending" && (
        <button
          onClick={bulkDelete}
          style={{
            marginBottom: 12,
            background: "#DC2626",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🗑 Delete Selected ({selected.length})
        </button>
      )}

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
              <th>
                {status !== "pending" && (
                  <input
                    type="checkbox"
                    checked={
                      merchants.length > 0 &&
                      selected.length === merchants.length
                    }
                    onChange={selectAll}
                  />
                )}
              </th>
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
                <td>
                  {status !== "pending" && (
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  )}
                </td>
                <td>
                  <strong>{m.shop_name || "⚠ Missing"}</strong>
                </td>
                <td>{m.category || "⚠ Missing"}</td>
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
                  {status === "pending" && (
                    <>
                      <button
                        onClick={() => approveMerchant(m.id)}
                        style={{ marginRight: 8 }}
                      >
                        Approve
                      </button>
                      <button onClick={() => rejectMerchant(m.id)}>
                        Reject
                      </button>
                    </>
                  )}

                  {status !== "pending" && (
                    <button
                      onClick={() => deleteMerchant(m.id)}
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
                  )}
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
              cursor: "pointer",
            }}
          >
            {loading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
