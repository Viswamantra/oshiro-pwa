/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Admin → Merchants
 * FINAL PRODUCTION SAFE VERSION
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
  /* ====================== STATE ====================== */
  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("approved");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState([]);

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 🔥 NEW → Row Action Loading
  const [actionLoading, setActionLoading] = useState(null);

  /* ====================== LOAD ====================== */
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
      console.error(err);
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

  /* ====================== SEARCH ====================== */
  const searchMerchants = async () => {
    if (!search.trim()) return resetSearch();

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
            ((m.shop_name &&
              m.shop_name.toLowerCase().includes(keyword)) ||
              (m.mobile && m.mobile.startsWith(search)))
        );

      setMerchants(data);
      setHasMore(false);
      setSelected([]);
    } catch (err) {
      console.error(err);
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

  /* ====================== SELECTION ====================== */
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selected.length === merchants.length) setSelected([]);
    else setSelected(merchants.map((m) => m.id));
  };

  /* ====================== ACTIONS ====================== */

  // ✅ FINAL APPROVE
  const approveMerchant = async (id) => {
    try {
      setActionLoading(id);

      await updateDoc(doc(db, "merchants", id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      setMerchants((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert("Approve failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ FINAL REJECT
  const rejectMerchant = async (id) => {
    if (!window.confirm("Reject this merchant?")) return;

    try {
      setActionLoading(id);

      await updateDoc(doc(db, "merchants", id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      setMerchants((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert("Reject failed: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteMerchant = async (id) => {
    if (!window.confirm("Delete merchant permanently?")) return;

    try {
      await deleteDoc(doc(db, "merchants", id));
      setMerchants((prev) => prev.filter((m) => m.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;

    if (!window.confirm(`Delete ${selected.length} merchants?`)) return;

    await Promise.all(
      selected.map((id) => deleteDoc(doc(db, "merchants", id)))
    );

    setMerchants((prev) => prev.filter((m) => !selected.includes(m.id)));
    setSelected([]);
  };

  /* ====================== UI ====================== */
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22 }}>Merchants</h2>

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
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABLE */}
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
              <th></th>
              <th align="left">Shop Name</th>
              <th align="left">Category</th>
              <th align="left">Mobile</th>
              <th align="left">Status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {merchants.map((m) => (
              <tr key={m.id}>
                <td></td>
                <td>{m.shop_name}</td>
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
                  {status === "pending" && (
                    <>
                      <button
                        onClick={() => approveMerchant(m.id)}
                        disabled={actionLoading === m.id}
                        style={{ marginRight: 8 }}
                      >
                        {actionLoading === m.id
                          ? "Approving..."
                          : "Approve"}
                      </button>

                      <button
                        onClick={() => rejectMerchant(m.id)}
                        disabled={actionLoading === m.id}
                      >
                        {actionLoading === m.id
                          ? "Updating..."
                          : "Reject"}
                      </button>
                    </>
                  )}

                  {status !== "pending" && (
                    <button onClick={() => deleteMerchant(m.id)}>
                      Delete
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
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button disabled={loading} onClick={() => loadMerchants()}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
