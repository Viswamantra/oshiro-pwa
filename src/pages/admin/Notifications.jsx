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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

const PAGE_SIZE = 10;

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    target: "all", // all | customers | merchants
    status: "active",
  });

  /* ======================
     LOAD NOTIFICATIONS
  ====================== */
  const loadNotifications = async (reset = false) => {
    try {
      setLoading(true);

      let q = query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (!reset && lastDoc) {
        q = query(
          collection(db, "notifications"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setNotifications(reset ? data : [...notifications, ...data]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Load notifications error:", err);
      alert("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(true);
    // eslint-disable-next-line
  }, []);

  /* ======================
     CREATE
  ====================== */
  const createNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      alert("Title and message are required");
      return;
    }

    try {
      await addDoc(collection(db, "notifications"), {
        title: form.title.trim(),
        message: form.message.trim(),
        target: form.target,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setForm({
        title: "",
        message: "",
        target: "all",
        status: "active",
      });

      setNotifications([]);
      setLastDoc(null);
      loadNotifications(true);
    } catch (err) {
      console.error("Create notification error:", err);
      alert("Failed to create notification");
    }
  };

  /* ======================
     ENABLE / DISABLE
  ====================== */
  const toggleStatus = async (id, currentStatus) => {
    const newStatus =
      currentStatus === "active" ? "disabled" : "active";

    try {
      await updateDoc(doc(db, "notifications", id), {
        status: newStatus,
      });

      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, status: newStatus } : n
        )
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      alert("Failed to update status");
    }
  };

  /* ======================
     DELETE
  ====================== */
  const deleteNotification = async (id) => {
    if (!window.confirm("Delete notification?")) return;

    try {
      await deleteDoc(doc(db, "notifications", id));
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete notification error:", err);
      alert("Failed to delete notification");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Notifications</h2>

      {/* CREATE FORM */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 15,
          marginBottom: 20,
        }}
      >
        <h4>Create Notification</h4>

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <br />

        <textarea
          placeholder="Message"
          value={form.message}
          onChange={(e) =>
            setForm({ ...form, message: e.target.value })
          }
        />

        <br />

        <select
          value={form.target}
          onChange={(e) =>
            setForm({ ...form, target: e.target.value })
          }
        >
          <option value="all">All Users</option>
          <option value="customers">Customers</option>
          <option value="merchants">Merchants</option>
        </select>

        <br />

        <button onClick={createNotification}>
          Send Notification
        </button>
      </div>

      {/* TABLE */}
      <table border="1" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Title</th>
            <th>Message</th>
            <th>Target</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((n) => (
            <tr key={n.id}>
              <td>{n.title}</td>
              <td>{n.message}</td>
              <td>{n.target}</td>
              <td>{n.status}</td>
              <td>
                {n.createdAt
                  ? new Date(
                      n.createdAt.seconds * 1000
                    ).toLocaleString()
                  : "-"}
              </td>
              <td>
                <button
                  onClick={() =>
                    toggleStatus(n.id, n.status)
                  }
                >
                  {n.status === "active"
                    ? "Disable"
                    : "Enable"}
                </button>
                <button
                  onClick={() =>
                    deleteNotification(n.id)
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {notifications.length === 0 && !loading && (
        <p>No notifications found.</p>
      )}

      {/* PAGINATION */}
      {hasMore && (
        <button
          disabled={loading}
          onClick={() => loadNotifications(false)}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
