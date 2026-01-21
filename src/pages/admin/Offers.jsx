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
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";

const PAGE_SIZE = 10;

/* ======================
   UI CONSTANTS
====================== */
const STATUS_META = {
  active: { color: "#16A34A", bg: "#DCFCE7" },
  disabled: { color: "#D97706", bg: "#FEF3C7" },
  expired: { color: "#DC2626", bg: "#FEE2E2" },
};

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD OFFERS
  ====================== */
  const loadOffers = async (reset = false) => {
    try {
      setLoading(true);

      let q = query(
        collection(db, "offers"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDoc) {
        q = query(
          collection(db, "offers"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);
      const now = new Date();

      const data = snap.docs.map((d) => {
        const o = d.data();
        let computedStatus = (o.status || "active").toLowerCase();

        if (o.validTill?.seconds) {
          const expiry = new Date(o.validTill.seconds * 1000);
          if (expiry < now) computedStatus = "expired";
        }

        return {
          id: d.id,
          title: o.title || "(No title)",
          merchantMobile: o.merchantMobile || "-",
          categoryName: o.categoryName || "-",
          status: computedStatus,
          validTill: o.validTill || null,
        };
      });

      setOffers(reset ? data : [...offers, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
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
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  /* ======================
     ACTIONS
  ====================== */
  const toggleOffer = async (id, currentStatus) => {
    if (currentStatus === "expired") return;

    const newStatus =
      currentStatus === "active" ? "disabled" : "active";

    await updateDoc(doc(db, "offers", id), { status: newStatus });

    setOffers((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: newStatus } : o
      )
    );
  };

  const deleteOffer = async (id) => {
    if (!window.confirm("Delete this offer permanently?")) return;
    await deleteDoc(doc(db, "offers", id));
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Offers</h1>
        <p style={{ color: "#6B7280" }}>
          Manage active, disabled and expired offers
        </p>
      </div>

      {/* STATUS TABS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {["active", "disabled", "expired"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              padding: "8px 20px",
              borderRadius: 999,
              border:
                status === s
                  ? "none"
                  : `1px solid ${STATUS_META[s].color}`,
              background:
                status === s ? STATUS_META[s].color : "#fff",
              color: status === s ? "#fff" : STATUS_META[s].color,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          maxWidth: 520,
          marginBottom: 28,
        }}
      >
        <span>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search offers by title"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              background: "transparent",
              border: "none",
              color: "#2563EB",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        )}
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
        <table width="100%" cellPadding="16">
          <thead style={{ background: "#F9FAFB" }}>
            <tr>
              <th align="left">Title</th>
              <th align="left">Merchant</th>
              <th align="left">Category</th>
              <th align="left">Status</th>
              <th align="right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleOffers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center" }}>
                  📭 No offers found
                </td>
              </tr>
            )}

            {visibleOffers.map((o) => (
              <tr
                key={o.id}
                style={{
                  borderTop: "1px solid #E5E7EB",
                  background: "#fff",
                }}
              >
                <td style={{ fontWeight: 600 }}>{o.title}</td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
                <td>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      background: STATUS_META[o.status].bg,
                      color: STATUS_META[o.status].color,
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                <td align="right">
                  <button
                    disabled={o.status === "expired"}
                    onClick={() => toggleOffer(o.id, o.status)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid #D1D5DB",
                      background: "#fff",
                      marginRight: 8,
                      cursor: "pointer",
                      opacity: o.status === "expired" ? 0.5 : 1,
                    }}
                  >
                    {o.status === "active" ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => deleteOffer(o.id)}
                    title="Delete offer"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #FCA5A5",
                      background: "#fff",
                      color: "#DC2626",
                      cursor: "pointer",
                    }}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LOAD MORE */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={() => loadOffers(false)}
            disabled={loading}
            style={{
              padding: "12px 32px",
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
