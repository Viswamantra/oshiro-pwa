import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function MerchantOffers() {
  const session = JSON.parse(localStorage.getItem("merchant"));

  const [merchant, setMerchant] = useState(null);
  const [offers, setOffers] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validTill, setValidTill] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ======================
     LOAD MERCHANT (🔥 FIX)
  ====================== */
  useEffect(() => {
    if (!session?.id) return;

    getDoc(doc(db, "merchants", session.id)).then((snap) => {
      if (snap.exists()) {
        setMerchant({ id: snap.id, ...snap.data() });
      }
    });
  }, [session?.id]);

  /* ======================
     LOAD MERCHANT OFFERS
  ====================== */
  useEffect(() => {
    if (!merchant?.id) return;

    const q = query(
      collection(db, "offers"),
      where("merchantId", "==", merchant.id)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setOffers(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [merchant?.id]);

  /* ======================
     ADD / UPDATE OFFER
  ====================== */
  const saveOffer = async () => {
    if (!title.trim()) {
      alert("Offer title required");
      return;
    }

    if (!merchant) {
      alert("Merchant not ready");
      return;
    }

    try {
      setLoading(true);

      /* 🔥 RULE-COMPLIANT PAYLOAD */
      const offerPayload = {
        merchantId: merchant.id,

        // ✅ REQUIRED BY RULES + ADMIN UI
        shop_name: merchant.shop_name,
        mobile: merchant.mobile,
        category: merchant.category,

        title,
        description,
        validTill: validTill || null,
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "offers", editingId), {
          title,
          description,
          validTill: validTill || null,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "offers"), {
          ...offerPayload,
          createdAt: serverTimestamp(),
        });
      }

      setTitle("");
      setDescription("");
      setValidTill("");
      setEditingId(null);
    } catch (err) {
      console.error("Offer save failed:", err);
      alert("Failed to save offer");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     EDIT OFFER
  ====================== */
  const editOffer = (offer) => {
    setEditingId(offer.id);
    setTitle(offer.title || "");
    setDescription(offer.description || "");
    setValidTill(offer.validTill || "");
  };

  /* ======================
     DELETE OFFER
  ====================== */
  const deleteOffer = async (id) => {
    if (!window.confirm("Delete this offer?")) return;

    try {
      await deleteDoc(doc(db, "offers", id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete offer");
    }
  };

  return (
    <div>
      <h2>My Offers</h2>

      {/* OFFER FORM */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Offer Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={input}
        />

        <textarea
          placeholder="Offer Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={input}
        />

        <input
          type="date"
          value={validTill}
          onChange={(e) => setValidTill(e.target.value)}
          style={input}
        />

        <button onClick={saveOffer} disabled={loading}>
          {editingId ? "Update Offer" : "Add Offer"}
        </button>
      </div>

      {/* OFFER LIST */}
      {offers.length === 0 && <p>No offers created yet</p>}

      {offers.map((o) => (
        <div key={o.id} style={card}>
          <h4>{o.title}</h4>
          {o.description && <p>{o.description}</p>}
          {o.validTill && <p>Valid till: {o.validTill}</p>}

          <button onClick={() => editOffer(o)}>Edit</button>
          <button
            onClick={() => deleteOffer(o.id)}
            style={{ marginLeft: 10, color: "red" }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

/* ======================
   STYLES
====================== */
const input = {
  width: "100%",
  padding: 8,
  marginBottom: 8,
};

const card = {
  border: "1px solid #ccc",
  padding: 12,
  marginBottom: 10,
  borderRadius: 6,
};
