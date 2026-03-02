/* =========================================================
   FIRESTORE IMPORTS
========================================================= */
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";

import { db } from "../firebase";

/* =========================================================
   CONFIG
========================================================= */
const CHECK_INTERVAL_MS = 15000;
const GEOFENCE_RADIUS_METERS = 300;
const EVENT_COOLDOWN_MS = 5 * 60 * 1000;

/* =========================================================
   DISTANCE (HAVERSINE)
========================================================= */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* =========================================================
   SAVE CUSTOMER LOCATION
========================================================= */
async function saveCustomerLocation(customerId, location) {
  try {
    const ref = doc(db, "customers", customerId);

    await setDoc(
      ref,
      {
        lat: location.lat,
        lng: location.lng,
        lastLocationUpdate: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.log("Location save error:", err.message);
  }
}

/* =========================================================
   GEO EVENT
========================================================= */
const merchantCooldownMap = new Map();

async function createGeoEvent(customerId, merchantId, distance) {
  try {
    const now = Date.now();
    const lastTriggered = merchantCooldownMap.get(merchantId);

    if (lastTriggered && now - lastTriggered < EVENT_COOLDOWN_MS) {
      return;
    }

    await addDoc(collection(db, "geo_events"), {
      customerId,
      merchantId,
      distanceMeters: Math.floor(distance),
      notified: false,
      createdAt: serverTimestamp(),
    });

    merchantCooldownMap.set(merchantId, now);

    console.log("🚀 Geo event created:", merchantId);
  } catch (err) {
    console.log("Geo event error:", err.message);
  }
}

/* =========================================================
   CHECK NEARBY MERCHANTS
========================================================= */
async function checkNearbyMerchants(customerId, location) {
  try {
    const merchantsSnap = await getDocs(
      query(
        collection(db, "merchants"),
        where("status", "==", "approved")
      )
    );

    const merchants = merchantsSnap.docs.map((m) => ({
      id: m.id,
      ...m.data(),
    }));

    console.log("🔥 merchants fetched (hybrid):", merchants);

    for (const m of merchants) {
      if (!m?.location?.lat || !m?.location?.lng) continue;

      const dist = getDistanceMeters(
        location.lat,
        location.lng,
        m.location.lat,
        m.location.lng
      );

      if (dist <= GEOFENCE_RADIUS_METERS) {
        console.log("🟢 Inside geofence:", m.id, dist);
        await createGeoEvent(customerId, m.id, dist);
      }
    }
  } catch (err) {
    console.log("Merchant scan error:", err.message);
  }
}

/* =========================================================
   EXPORT START LOCATION HYBRID
========================================================= */
export function startLocationHybrid(customerId) {
  if (!customerId) {
    console.log("❌ No customerId provided");
    return;
  }

  if (!("geolocation" in navigator)) {
    console.log("❌ Geolocation not supported");
    return;
  }

  console.log("📡 Starting live location tracking...");

  let lastCheck = 0;

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      try {
        const location = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };

        await saveCustomerLocation(customerId, location);

        const now = Date.now();
        if (now - lastCheck > CHECK_INTERVAL_MS) {
          lastCheck = now;
          await checkNearbyMerchants(customerId, location);
        }
      } catch (err) {
        console.log("Tracking loop error:", err.message);
      }
    },
    (err) => {
      console.log("GPS Error:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    }
  );

  return () => {
    console.log("🛑 Stopping location tracking");
    navigator.geolocation.clearWatch(watchId);
  };
}