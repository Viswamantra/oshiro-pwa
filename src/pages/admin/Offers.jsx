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
import "./admin-offers.css";

const PAGE_SIZE = 10;

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

  const visibleOffers = offers.filter(
    (o) =>
      o.status === status &&
      o.title.toLowerCase().includes(search.toLowerCase())
  );

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
          placeholder="Search offers by title"
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
              <th>Title</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleOffers.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  📭 No offers found
                </td>
              </tr>
            )}

            {visibleOffers.map((o) => (
              <tr key={o.id}>
                <td className="title">{o.title}</td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
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
