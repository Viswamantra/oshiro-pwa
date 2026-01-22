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
import "../../admin/admin-offers.css";


const PAGE_SIZE = 10;

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

      // Normalize status
      let computedStatus = (o.status || "active").toLowerCase();

      // Expiry handling
      let expiryText = "—";
      if (o.validTill?.seconds) {
        const expiry = new Date(o.validTill.seconds * 1000);
        expiryText = expiry.toLocaleDateString();
        if (expiry < now) computedStatus = "expired";
      }

      return {
        id: d.id,
        shopName: o.shopName || "—",
        merchantMobile: o.merchantMobile || "—",
        categoryName: o.categoryName || "—",
        title: o.title || "—",
        description: o.description || "—",
        expiry: expiryText,
        status: computedStatus,
      };
    });

    setOffers(reset ? data : [...offers, ...data]);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    loadOffers(true);
    // eslint-disable-next-line
  }, []);

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
    if (!window.confirm("Delete offer permanently?")) return;
    await deleteDoc(doc(db, "offers", id));
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="admin-offers">
      {/* HEADER */}
      <div className="offers-header">
        <h1>Offers</h1>
        <p>Manage active, disabled and expired offers</p>
      </div>

      {/* STATUS FILTER */}
      <div className="status-tabs">
        {["active", "disabled", "expired"].map((s) => (
          <button
            key={s}
            className={`status-tab ${status === s ? "active" : ""} ${s}`}
            onClick={() => setStatus(s)}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* SEARCH */}
      <div className="search-bar">
        <span>🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by offer title"
        />
        {search && (
          <button className="clear-btn" onClick={() => setSearch("")}>
            Clear
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Shop Name</th>
              <th>Merchant Mobile</th>
              <th>Category</th>
              <th>Offer Title</th>
              <th>Description</th>
              <th>Expiry</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleOffers.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-state">
                  No offers found
                </td>
              </tr>
            )}

            {visibleOffers.map((o) => (
              <tr key={o.id}>
                <td>{o.shopName}</td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
                <td className="title">{o.title}</td>
                <td style={{ maxWidth: 260 }}>
                  {o.description}
                </td>
                <td>{o.expiry}</td>
                <td>
                  <span className={`status-pill ${o.status}`}>
                    {o.status}
                  </span>
                </td>
                <td className="actions-col">
                  <button
                    className="action-btn"
                    disabled={o.status === "expired"}
                    onClick={() => toggleOffer(o.id, o.status)}
                  >
                    {o.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteOffer(o.id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="load-more">
          <button onClick={() => loadOffers(false)} disabled={loading}>
            {loading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
