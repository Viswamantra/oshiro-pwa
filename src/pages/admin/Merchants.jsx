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
  pending: "#F59E0B",
  approved: "#16A34A",
  rejected: "#DC2626",
};

export default function Merchants() {
  /* ======================
     STATE
  ====================== */
  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("approved"); // ✅ DEFAULT = APPROVED
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

      // Filter by status on client side (no index)
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => m.status === status);

      setMerchants(reset ? data : [...merchants, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
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
    loadMerchants(true);
    // eslint-disable-next-line
  }, [status]);

  /* ======================
     SEARCH (SHOP NAME / MOBILE)
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

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (m) =>
            m.status === status &&
            (
              (m.mobile && m.mobile.startsWith(search)) ||
              (m.name && m.name.toLowerCase().includes(search.toLowerCase()))
            )
        );

      setMerchants(data);
      setHasMore(false);
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
    loadMerchants(true);
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

  /* ======================
     UI
  ====================== */
  return (
    <div style={{ padding: 24 }}>
      <h2>Merchants</h2>
      <p style={{ color: "#6B7280" }}>
        Approved merchants are shown by default
      </p>

      {/* STATUS FILTER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["approved", "pending", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${STATUS_COLORS[s]}`,
              background: status === s ? STATUS_COLORS[s] : "transparent",
              color: status === s ? "#fff" : STATUS_COLORS[s],
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Search by shop name or mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, marginRight: 8 }}
        />
        <button onClick={searchMerchants}>Search</button>
        <button onClick={resetSearch} style={{ marginLeft: 6 }}>
          Reset
        </button>
      </div>

      {/* TABLE */}
      <table width="100%" cellPadding="10" style={{ background: "#fff" }}>
        <thead>
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
            <tr key={m.id} style={{ borderTop: "1px solid #eee" }}>
              <td><strong>{m.name || "-"}</strong></td>
              <td>{m.category || "-"}</td>
              <td>{m.mobile}</td>
              <td>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: STATUS_COLORS[m.status] + "22",
                    color: STATUS_COLORS[m.status],
                    fontSize: 12,
                  }}
                >
                  {m.status}
                </span>
              </td>
              <td>
                {status === "pending" && (
                  <>
                    <button onClick={() => approveMerchant(m.id)}>
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMerchant(m.id)}
                      style={{ marginLeft: 6 }}
                    >
                      Reject
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

      {/* LOAD MORE */}
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
