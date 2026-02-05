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

  // ✅ NEW: selection state
  const [selected, setSelected] = useState([]);

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

      let expiryText = "—";
      if (o.expiryDate && !isNaN(new Date(o.expiryDate))) {
        const expiry = new Date(o.expiryDate);
        expiryText = expiry.toLocaleDateString();
        if (expiry < now) computedStatus = "expired";
      }

      return {
        id: d.id,
        shopName: o.shopName || o.shop_name || "—",
        merchantMobile: o.merchantMobile || o.mobile || "—",
        categoryName: o.categoryName || o.category || "—",
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

  /* ======================
     FILTER
  ====================== */
  const visibleOffers = offers.filter((o) => {
    if (o.status !== status) return false;
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

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
    const ids = visibleOffers.map((o) => o.id);
    setSelected(
      ids.every((id) => selected.includes(id)) ? [] : ids
    );
  };

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
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const bulkDelete = async () => {
    if (selected.length === 0) return;
    if (
      !window.confirm(
        `Delete ${selected.length} offer(s) permanently?`
      )
    )
      return;

    await Promise.all(
      selected.map((id) => deleteDoc(doc(db, "offers", id)))
    );

    setOffers((prev) => prev.filter((o) => !selected.includes(o.id)));
    setSelected([]);
  };

  /* ======================
     UI
  ====================== */
  return (
    <div className="admin-offers">
      <div className="offers-header">
        <h1>Offers</h1>
        <p>Manage active, disabled and expired offers</p>

        {selected.length > 0 && (
          <button className="bulk-delete" onClick={bulkDelete}>
            🗑 Delete Selected ({selected.length})
          </button>
        )}
      </div>

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

      <div className="search-bar">
        <span>🔍</span>
        <input
          placeholder="Search by offer title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    visibleOffers.length > 0 &&
                    visibleOffers.every((o) =>
                      selected.includes(o.id)
                    )
                  }
                  onChange={selectAll}
                />
              </th>
              <th>Shop Name</th>
              <th>Merchant Mobile</th>
              <th>Category</th>
              <th>Offer Title</th>
              <th>Description</th>
              <th>Expiry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {visibleOffers.length === 0 && (
              <tr>
                <td colSpan="9" className="empty-state">
                  No offers found
                </td>
              </tr>
            )}

            {visibleOffers.map((o) => (
              <tr key={o.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() => toggleSelect(o.id)}
                  />
                </td>
                <td>{o.shopName}</td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
                <td>{o.title}</td>
                <td>{o.description}</td>
                <td>{o.expiry}</td>
                <td>
                  <span className={`status-pill ${o.status}`}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <button
                    disabled={o.status === "expired"}
                    onClick={() => toggleOffer(o.id, o.status)}
                  >
                    {o.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteOffer(o.id)}>🗑</button>
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
