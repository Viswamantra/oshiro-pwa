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

  /* ======================
     LOAD OFFERS (SAFE)
  ====================== */
  const loadOffers = async (reset = false) => {
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

      // ✅ Normalize status
      let normalizedStatus = (o.status || "active").toLowerCase();

      // ✅ Expiry handling (optional field)
      let expiryText = "-";
      if (o.validTill?.seconds) {
        const expiry = new Date(o.validTill.seconds * 1000);
        expiryText = expiry.toLocaleDateString();
        if (expiry < now) normalizedStatus = "expired";
      }

      return {
        id: d.id,

        // ✅ Optional-safe fields
        shopName: o.shopName ?? "—",
        merchantMobile: o.merchantMobile ?? "—",
        categoryName: o.categoryName ?? "—",
        title: o.title ?? "—",
        description: o.description ?? "—",
        expiry: expiryText,

        status: normalizedStatus,
      };
    });

    setOffers(reset ? data : [...offers, ...data]);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
  };

  useEffect(() => {
    loadOffers(true);
    // eslint-disable-next-line
  }, []);

  /* ======================
     FILTER (FAIL-SAFE)
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

  return (
    <div className="admin-offers">
      <div className="offers-header">
        <h1>Offers</h1>
        <p>Manage active, disabled and expired offers</p>
      </div>

      {/* STATUS TABS */}
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
          placeholder="Search by offer title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            </tr>
          </thead>

          <tbody>
            {visibleOffers.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  No offers available for this filter
                </td>
              </tr>
            )}

            {visibleOffers.map((o) => (
              <tr key={o.id}>
                <td>{o.shopName}</td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
                <td className="title">{o.title}</td>
                <td style={{ maxWidth: 260 }}>{o.description}</td>
                <td>{o.expiry}</td>
                <td>
                  <span className={`status-pill ${o.status}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
