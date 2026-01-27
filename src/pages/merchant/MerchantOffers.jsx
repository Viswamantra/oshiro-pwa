import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export default function MerchantOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ Replace with logged-in merchant ID later
  const merchantId = localStorage.getItem("merchantId");

  useEffect(() => {
    const loadOffers = async () => {
      try {
        if (!merchantId) {
          setOffers([]);
          return;
        }

        const snap = await getDocs(
          query(
            collection(db, "offers"),
            where("merchantId", "==", merchantId)
          )
        );

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setOffers(list);
      } catch (e) {
        console.error("Failed to load offers", e);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, [merchantId]);

  if (loading) return <p>Loading offers…</p>;

  return (
    <div>
      <h2>My Offers</h2>

      {offers.length === 0 && <p>No offers created yet</p>}

      {offers.map((o) => (
        <div key={o.id} style={card}>
          <h4>{o.title}</h4>
          {o.description && <p>{o.description}</p>}
          <small>Status: {o.isActive ? "Active" : "Inactive"}</small>
        </div>
      ))}
    </div>
  );
}

const card = {
  border: "1px solid #ddd",
  padding: 12,
  borderRadius: 6,
  marginBottom: 10,
};
