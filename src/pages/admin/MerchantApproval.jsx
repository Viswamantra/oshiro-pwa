import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

export default function MerchantApproval() {
  const [merchants, setMerchants] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "merchants"),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMerchants(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });

    return () => unsub();
  }, []);

  const approveMerchant = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "approved",
      approvedAt: serverTimestamp()
    });
  };

  const rejectMerchant = async (id) => {
    await updateDoc(doc(db, "merchants", id), {
      status: "rejected",
      rejectedAt: serverTimestamp()
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Pending Merchant Approvals</h2>

      {merchants.length === 0 && <p>No pending merchants</p>}

      {merchants.map(m => (
        <div key={m.id} style={{
          border: "1px solid #ccc",
          padding: 15,
          marginBottom: 10,
          borderRadius: 6
        }}>
          <p><b>Name:</b> {m.name}</p>
          <p><b>Mobile:</b> {m.mobile}</p>
          <p><b>Category:</b> {m.category}</p>

          <button onClick={() => approveMerchant(m.id)} style={{ marginRight: 10 }}>
            ✅ Approve
          </button>

          <button onClick={() => rejectMerchant(m.id)} style={{ background: "#ff4d4d", color: "#fff" }}>
            ❌ Reject
          </button>
        </div>
      ))}
    </div>
  );
}
