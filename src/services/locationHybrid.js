import { doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/* =========================================================
   GET LIVE GPS LOCATION
========================================================= */
export const getLiveLocation = () => {
  return new Promise((resolve, reject) => {

    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  });
};

/* =========================================================
   HYBRID LOCATION UPDATE (PRODUCTION SAFE)
========================================================= */
export const hybridUpdateCustomerLocation = async (
  customerId,
  savedLocation = null
) => {

  if (!customerId) {
    console.log("❌ No customerId for location update");
    return savedLocation;
  }

  try {

    console.log("📍 Trying live GPS...");

    const liveLocation = await getLiveLocation();

    const ref = doc(db, "customers", customerId);

    /* -----------------------------------------------------
       Try Update → If doc not exists → Create
    ----------------------------------------------------- */
    try {

      await updateDoc(ref, {
        lat: liveLocation.lat,
        lng: liveLocation.lng,
        lastLocationUpdate: serverTimestamp(),
      });

    } catch (updateErr) {

      console.log("Doc not exists → Creating location doc");

      await setDoc(
        ref,
        {
          lat: liveLocation.lat,
          lng: liveLocation.lng,
          lastLocationUpdate: serverTimestamp(),
        },
        { merge: true }
      );
    }

    console.log("✅ Live location saved:", liveLocation);

    return liveLocation;

  } catch (err) {

    console.log("⚠ Live GPS failed → Using saved", err);

    return savedLocation || null;
  }
};
