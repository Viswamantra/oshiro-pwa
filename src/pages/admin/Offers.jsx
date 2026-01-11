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

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState("active"); // active | disabled | expired
  const [search, setSearch] = useState("");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD OFFERS (SAFE)
     - NO index
     - NO status filter in query
  ====================== */
  const loadOffers = async (reset = false) => {
    try {
      setLoading(true);

      let q = query(
        collection(db, "offers"),
        limit(PAGE_SIZE)
      );

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
    <div style={{ padding: 20 }}>
      <h2>Offers</h2>

      {/* STATUS FILTER */}
      <div style={{ marginBottom: 15 }}>
        <button onClick={() => setStatus("active")}>
          Active
        </button>
        <button onClick={() => setStatus("disabled")}>
          Disabled
        </button>
        <button onClick={() => setStatus("expired")}>
          Expired
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Search by offer title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setSearch("")}>
          Reset
        </button>
      </div>

      {/* TABLE */}
      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Title</th>
            <th>Merchant</th>
            <th>Category</th>
            <th>Status</th>
            <th>Valid Till</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleOffers.map((o) => (
            <tr key={o.id}>
              <td>{o.title}</td>
              <td>{o.merchantMobile}</td>
              <td>{o.categoryName}</td>
              <td>{o.status}</td>
              <td>
                {o.validTill?.seconds
                  ? new Date(
                      o.validTill.seconds * 1000
                    ).toLocaleDateString()
                  : "-"}
              </td>
              <td>
                <button
                  onClick={() =>
                    toggleOffer(o.id, o.status)
                  }
                >
                  {o.status === "active"
                    ? "Disable"
                    : "Enable"}
                </button>
                <button
                  onClick={() => deleteOffer(o.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {visibleOffers.length === 0 && (
        <p>No offers found.</p>
      )}

      {/* PAGINATION */}
      {hasMore && (
        <button
          disabled={loading}
          onClick={() => loadOffers(false)}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
