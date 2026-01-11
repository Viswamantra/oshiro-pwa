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

export default function Merchants() {
  const [merchants, setMerchants] = useState([]);
  const [status, setStatus] = useState("pending"); // pending | approved | rejected
  const [search, setSearch] = useState("");

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD MERCHANTS
     (NO INDEX REQUIRED)
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

      // FILTER STATUS IN JS (avoids index)
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
     SEARCH (MOBILE PREFIX)
     (NO INDEX)
  ====================== */
  const searchMerchants = async () => {
    if (!search.trim()) {
      setMerchants([]);
      setLastDoc(null);
      loadMerchants(true);
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
            m.mobile &&
            m.mobile.startsWith(search)
        );

      setMerchants(data);
      setHasMore(false);
    } catch (err) {
      console.error("Search merchants error:", err);
      alert("Failed to search merchants");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     APPROVE
  ====================== */
  const approveMerchant = async (id) => {
    try {
      await updateDoc(doc(db, "merchants", id), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      setMerchants(merchants.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Approve merchant error:", err);
      alert("Failed to approve merchant");
    }
  };

  /* ======================
     REJECT
  ====================== */
  const rejectMerchant = async (id) => {
    if (!window.confirm("Reject merchant?")) return;

    try {
      await updateDoc(doc(db, "merchants", id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      setMerchants(merchants.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Reject merchant error:", err);
      alert("Failed to reject merchant");
    }
  };

  /* ======================
     DELETE
  ====================== */
  const deleteMerchant = async (id) => {
    if (!window.confirm("Delete merchant permanently?")) return;

    try {
      await deleteDoc(doc(db, "merchants", id));
      setMerchants(merchants.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Delete merchant error:", err);
      alert("Failed to delete merchant");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Merchants</h2>

      {/* STATUS FILTER */}
      <div style={{ marginBottom: 15 }}>
        <button onClick={() => setStatus("pending")}>
          Pending
        </button>
        <button onClick={() => setStatus("approved")}>
          Approved
        </button>
        <button onClick={() => setStatus("rejected")}>
          Rejected
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Search by mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={searchMerchants}>
          Search
        </button>
        <button
          onClick={() => {
            setSearch("");
            setMerchants([]);
            setLastDoc(null);
            loadMerchants(true);
          }}
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.mobile}</td>
              <td>{m.status}</td>
              <td>
                {status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        approveMerchant(m.id)
                      }
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        rejectMerchant(m.id)
                      }
                    >
                      Reject
                    </button>
                  </>
                )}

                {status !== "pending" && (
                  <button
                    onClick={() =>
                      deleteMerchant(m.id)
                    }
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      {hasMore && (
        <button
          disabled={loading}
          onClick={() => loadMerchants(false)}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
