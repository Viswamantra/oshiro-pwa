import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
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

    async function loadMerchantsWithOffers() {
      try {
        setLoading(true);

        /* ======================
           1️⃣ GET ACTIVE OFFERS
        ====================== */
        const offersSnap = await getDocs(
          query(
            collection(db, "offers"),
            where("isActive", "==", true)
          )
        );

        // Unique merchantIds that have active offers
        const activeMerchantIds = new Set(
          offersSnap.docs.map((d) => d.data().merchantId)
        );

        if (activeMerchantIds.size === 0) {
          if (mounted) {
            setMerchants([]);
            setLoading(false);
          }
          return;
        }

        /* ======================
           2️⃣ GET APPROVED MERCHANTS
        ====================== */
        const merchantsSnap = await getDocs(
          query(
            collection(db, "merchants"),
            where("status", "==", "approved")
          )
        );

        let list = merchantsSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // 🔥 ONLY merchants who have active offers
          .filter((m) => activeMerchantIds.has(m.id));

        /* ======================
           3️⃣ CATEGORY FILTER
        ====================== */
        if (category && CATEGORY_ID_TO_NAME[category]) {
          const categoryName = CATEGORY_ID_TO_NAME[category];
          list = list.filter(
            (m) => m.category === categoryName
          );
        }

        /* ======================
           4️⃣ DISTANCE FILTER
        ====================== */
        if (userLat && userLng && distance) {
          list = list.filter((m) => {
            const lat = m.lat ?? m.location?.lat;
            const lng = m.lng ?? m.location?.lng;

            if (!lat || !lng) return false;

            const d = getDistance(
              Number(userLat),
              Number(userLng),
              Number(lat),
              Number(lng)
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

    loadMerchantsWithOffers();
    return () => {
      mounted = false;
    };
  }, [category, distance, userLat, userLng]);

  /* ======================
     UI STATES
  ====================== */
  if (loading) return <p>Loading merchants…</p>;
  if (!merchants.length)
    return <p>No nearby merchants with active offers</p>;

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
