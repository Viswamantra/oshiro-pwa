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
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import "./admin-offers.css";

const PAGE_SIZE = 10;

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [merchantsMap, setMerchantsMap] = useState({});
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD MERCHANTS (ONCE)
  ====================== */
  const loadMerchants = async () => {
    const snap = await getDocs(collection(db, "merchants"));
    const map = {};
    snap.docs.forEach((d) => {
      map[d.id] = d.data();
    });
    setMerchantsMap(map);
  };

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

      let expiry = "-";
      if (o.validTill?.seconds) {
        const dt = new Date(o.validTill.seconds * 1000);
        expiry = dt.toLocaleDateString();
        if (dt < now) computedStatus = "expired";
      }

      const merchant = merchantsMap[o.merchantId] || {};

      return {
        id: d.id,
        shopName: merchant.shopName || "—",
        merchantMobile: o.merchantMobile || merchant.mobile || "—",
        categoryName: o.categoryName || "—",
        title: o.title || "—",
        description: o.description || "—",
        expiry,
        status: computedStatus,
      };
    });

    setOffers(reset ? data : [...offers, ...data]);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setLoading(false);
  };

  /* ======================
     INIT
  ====================== */
  useEffect(() => {
    loadMerchants().then(() => loadOffers(true));
    // eslint-disable-next-line
  }, []);

  const visibleOffers = offers.filter(
    (o) =>
      o.status === status &&
      o.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-offers">
      <h1>Offers</h1>
      <p>Manage active, disabled and expired offers</p>

      {/* STATUS */}
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
          placeholder="Search offer title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            {visibleOffers.map((o) => (
              <tr key={o.id}>
                <td>{o.shopName}</td>
                <td>{o.merchantMobile}</td>
                <td>{o.categoryName}</td>
                <td><strong>{o.title}</strong></td>
                <td style={{ maxWidth: 260 }}>{o.description}</td>
                <td>{o.expiry}</td>
                <td>
                  <span className={`status-pill ${o.status}`}>
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}

            {visibleOffers.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  No offers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
