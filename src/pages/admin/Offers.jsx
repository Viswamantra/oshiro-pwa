import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";

const PAGE_SIZE = 10;

/* ======================
   UI CONSTANTS
====================== */
const STATUS_COLORS = {
  active: "#16A34A",
  disabled: "#F59E0B",
  expired: "#DC2626",
};

const STATUS_BG = {
  active: "#DCFCE7",
  disabled: "#FEF3C7",
  expired: "#FEE2E2",
};

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD OFFERS (SAFE)
  ====================== */
  const loadOffers = async (reset = false) => {
    try {
      setLoading(true);

      let q = query(collection(db, "offers"), limit(PAGE_SIZE));

      if (!reset && lastDoc) {
        q = query(
          collection(db, "offers"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => {
        const o = d.data();
        return {
          id: d.id,
          title: o.title || "(No title)",
          merchantMobile: o.merchantMobile || "-",
          categoryName: o.categoryName || "-",
          status: (o.status || "active").toLowerCase(),
          validTill: o.validTill || null,
        };
      });

      setOffers(reset ? data : [...offers, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load offers error:", err);
      alert("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffers([]);
    setLastDoc(null);
    loadOffers(true);
    // eslint-disable-next-line
  }, []);

  /* ======================
     FILTERED VIEW
  ====================== */
  const visibleOffers = offers.filter((o) => {
    if (o.status !== status) return false;
    if (
      search &&
      !o.title.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  /* ======================
     ENABLE / DISABLE
  ====================== */
  const toggleOffer = async (id, currentStatus) => {
    try {
      const newStatus =
        currentStatus === "active" ? "disabled" : "active";

      await updateDoc(doc(db, "offers", id), {
        status: newStatus,
      });

      setOffers(
        offers.map((o) =>
          o.id === id ? { ...o, status: newStatus } : o
        )
      );
    } catch (err) {
      console.error("Toggle offer error:", err);
      alert("Failed to update offer");
    }
  };

  /* ======================
     DELETE
  ====================== */
  const deleteOffer = async (id) => {
    if (!window.confirm("Delete offer permanently?")) return;

    try {
      await deleteDoc(doc(db, "offers", id));
      setOffers(offers.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Delete offer error:", err);
      alert("Failed to delete offer");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Offers</h2>
      <p style={{ color: "#6B7280", marginBottom: 20 }}>
        Manage active, disabled and expired offers
      </p>

      {/* STATUS FILTER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["active", "disabled", "expired"].map((s) => (
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

      {/* SEARCH / RESET */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 16,
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          marginBottom: 24,
          maxWidth: 560,
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by offer title"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #D1D5DB",
          }}
        />
        <button
          onClick={() => setSearch("")}
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
              <th align="left">Title</th>
              <th align="left">Merchant</th>
              <th align="left">Category</th>
              <th align="left">Status</th>
              <th align="left">Valid Till</th>
              <th align="left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleOffers.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #E5E7EB" }}>
                <td><strong>{o.title}</strong></td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
                <td>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: STATUS_BG[o.status],
                      color: STATUS_COLORS[o.status],
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                <td>
                  {o.validTill?.seconds
                    ? new Date(
                        o.validTill.seconds * 1000
                      ).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    onClick={() => toggleOffer(o.id, o.status)}
                    style={{
                      marginRight: 8,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #D1D5DB",
                      background: "#fff",
                    }}
                  >
                    {o.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => deleteOffer(o.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #FCA5A5",
                      background: "#fff",
                      color: "#DC2626",
                    }}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visibleOffers.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>
            No offers found.
          </div>
        )}
      </div>

      {/* LOAD MORE */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button
            disabled={loading}
            onClick={() => loadOffers(false)}
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
