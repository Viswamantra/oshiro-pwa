import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase";

const PAGE_SIZE = 10;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    id: null,
    name: "",
    mobile: "",
    city: ""
  });

  /* ======================
     LOAD CUSTOMERS (SAFE)
  ====================== */
  const loadCustomers = async (reset = false) => {
    try {
      setLoading(true);

      let q = query(
        collection(db, "customers"),
        orderBy("mobile"),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDoc) {
        q = query(
          collection(db, "customers"),
          orderBy("mobile"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      setCustomers(reset ? data : [...customers, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load customers error:", err);
      alert("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(true);
    // eslint-disable-next-line
  }, []);

  /* ======================
     SEARCH (MOBILE PREFIX)
  ====================== */
  const searchCustomers = async () => {
    if (!search.trim()) {
      setCustomers([]);
      setLastDoc(null);
      loadCustomers(true);
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "customers"),
        orderBy("mobile"),
        startAfter(search),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(q);

      setCustomers(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }))
      );

      setHasMore(false);
    } catch (err) {
      console.error("Search customers error:", err);
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     ADD / UPDATE
  ====================== */
  const saveCustomer = async () => {
    if (!form.mobile.trim()) {
      alert("Mobile number required");
      return;
    }

    try {
      if (form.id) {
        await updateDoc(doc(db, "customers", form.id), {
          name: form.name,
          mobile: form.mobile,
          city: form.city
        });
      } else {
        await addDoc(collection(db, "customers"), {
          name: form.name,
          mobile: form.mobile,
          city: form.city,
          createdAt: serverTimestamp()
        });
      }

      setForm({ id: null, name: "", mobile: "", city: "" });
      setCustomers([]);
      setLastDoc(null);
      loadCustomers(true);
    } catch (err) {
      console.error("Save customer error:", err);
      alert("Failed to save customer");
    }
  };

  /* ======================
     DELETE
  ====================== */
  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete customer permanently?")) return;

    try {
      await deleteDoc(doc(db, "customers", id));
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete customer error:", err);
      alert("Failed to delete customer");
    }
  };

  /* ======================
     EDIT
  ====================== */
  const editCustomer = (c) => {
    setForm({
      id: c.id,
      name: c.name || "",
      mobile: c.mobile || "",
      city: c.city || ""
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, marginBottom: 4 }}>Customers</h2>
      <p style={{ color: "#6B7280", marginBottom: 20 }}>
        Manage registered customers
      </p>

      {/* SEARCH */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 16,
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          marginBottom: 20,
          maxWidth: 520
        }}
      >
        <input
          placeholder="Search by mobile"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #D1D5DB"
          }}
        />
        <button
          onClick={searchCustomers}
          style={{
            background: "#2563EB",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            fontWeight: 600
          }}
        >
          Search
        </button>
        <button
          onClick={() => {
            setSearch("");
            setCustomers([]);
            setLastDoc(null);
            loadCustomers(true);
          }}
          style={{
            background: "#fff",
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #D1D5DB"
          }}
        >
          Reset
        </button>
      </div>

      {/* ADD / UPDATE FORM */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: 16,
          marginBottom: 24,
          maxWidth: 720
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e =>
              setForm({ ...form, name: e.target.value })
            }
            style={{ flex: 1, padding: 10 }}
          />
          <input
            placeholder="Mobile"
            value={form.mobile}
            onChange={e =>
              setForm({ ...form, mobile: e.target.value })
            }
            style={{ flex: 1, padding: 10 }}
          />
          <input
            placeholder="City"
            value={form.city}
            onChange={e =>
              setForm({ ...form, city: e.target.value })
            }
            style={{ flex: 1, padding: 10 }}
          />
          <button
            onClick={saveCustomer}
            style={{
              background: "#2563EB",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              fontWeight: 600
            }}
          >
            {form.id ? "Update" : "Add"} Customer
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #E5E7EB",
          overflow: "hidden"
        }}
      >
        <table width="100%" cellPadding="14">
          <thead style={{ background: "#F9FAFB" }}>
            <tr>
              <th align="left">Name</th>
              <th align="left">Mobile</th>
              <th align="left">City</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderTop: "1px solid #E5E7EB" }}>
                <td>{c.name || "-"}</td>
                <td>{c.mobile}</td>
                <td>{c.city || "-"}</td>
                <td>
                  <button
                    onClick={() => editCustomer(c)}
                    style={{
                      marginRight: 8,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #D1D5DB",
                      background: "#fff"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCustomer(c.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #FCA5A5",
                      background: "#fff",
                      color: "#DC2626"
                    }}
                  >
                    🗑 Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#6B7280" }}>
            No customers found.
          </div>
        )}
      </div>

      {/* LOAD MORE */}
      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button
            disabled={loading}
            onClick={() => loadCustomers(false)}
            style={{
              padding: "12px 28px",
              borderRadius: 999,
              background: "#2563EB",
              color: "#fff",
              border: "none",
              fontWeight: 600
            }}
          >
            {loading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
