import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import MerchantCard from "./MerchantCard";

/* =========================================================
   CATEGORY ID → CATEGORY NAME MAP
========================================================= */
const CATEGORY_ID_TO_NAME = {
  EHuriAgh3jlwpZhvGi2N: "Food",
  PJYuU0ltUCkaUlRw55pm: "Medicals",
  Rb0wToy7ry1vsRRtdKy0: "Other Services",
  boaZo4fHBaPjkNDopOsn: "Education",
  cRjtnpg5oHQhSNt5vfCV: "Hospitals",
  dOculBYSS5tDphxvFvcl: "Beauty & Spa",
  zVBYDhPomvWi3rtBFbFj: "Fashion & Clothing",
  zXnSCXG0Qff8e4U4XcGX: "Home Kitchen",
};

/* =========================================================
   DISTANCE CALCULATION (METERS)
========================================================= */
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MerchantList({
  category,
  distance,
  userLat,
  userLng,
}) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadMerchants() {
      try {
        setLoading(true);

        // ✅ Only approved merchants
        const q = query(
          collection(db, "merchants"),
          where("status", "==", "approved")
        );

        const snap = await getDocs(q);

        let list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ Category filter (ID → Name)
        if (category && CATEGORY_ID_TO_NAME[category]) {
          const categoryName = CATEGORY_ID_TO_NAME[category];
          list = list.filter(
            (m) => m.category === categoryName
          );
        }

        // ✅ Distance filter
        if (userLat && userLng && distance) {
          list = list.filter((m) => {
            if (!m.lat || !m.lng) return false;

            const d = getDistance(
              Number(userLat),
              Number(userLng),
              Number(m.lat),
              Number(m.lng)
            );

            return d <= distance;
          });
        }

        if (mounted) {
          setMerchants(list);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load merchants:", err);
        if (mounted) setLoading(false);
      }
    }

    loadMerchants();
    return () => {
      mounted = false;
    };
  }, [category, distance, userLat, userLng]);

  /* ======================
     UI STATES
  ====================== */
  if (loading) return <p>Loading merchants…</p>;
  if (!merchants.length) return <p>No merchants found</p>;

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="merchant-list">
      {merchants.map((merchant) => (
        <MerchantCard
          key={merchant.id}
          merchant={merchant}
        />
      ))}
    </div>
  );
}
