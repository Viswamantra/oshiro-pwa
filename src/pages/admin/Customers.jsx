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
    if (!window.confirm("Delete customer?")) return;

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
    <div style={{ padding: 20 }}>
      <h2>Customers</h2>

      {/* SEARCH */}
      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Search by mobile"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={searchCustomers}>Search</button>
        <button
          onClick={() => {
            setSearch("");
            setCustomers([]);
            setLastDoc(null);
            loadCustomers(true);
          }}
        >
          Reset
        </button>
      </div>

      {/* FORM */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={e =>
            setForm({ ...form, name: e.target.value })
          }
        />
        <input
          placeholder="Mobile"
          value={form.mobile}
          onChange={e =>
            setForm({ ...form, mobile: e.target.value })
          }
        />
        <input
          placeholder="City"
          value={form.city}
          onChange={e =>
            setForm({ ...form, city: e.target.value })
          }
        />
        <button onClick={saveCustomer}>
          {form.id ? "Update" : "Add"} Customer
        </button>
      </div>

      {/* TABLE */}
      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>City</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.mobile}</td>
              <td>{c.city}</td>
              <td>
                <button onClick={() => editCustomer(c)}>
                  Edit
                </button>
                <button onClick={() => deleteCustomer(c.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      {hasMore && (
        <button
          disabled={loading}
          onClick={() => loadCustomers(false)}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
