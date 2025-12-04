// src/pages/HomeScreen.jsx
import { useEffect, useState, useRef } from "react";

// ---- MOCK MERCHANT DATA ----
// Later: replace with Firebase fetch
const MOCK_MERCHANTS = [
  {
    id: 1,
    name: "Sri Sai Tiffins",
    lat: 17.7381,
    lng: 83.3012,
    radius: 300, // meters
    category: "Food",
    offer: "Flat 10% off on dosa!",
  },
  {
    id: 2,
    name: "Meghana Textiles",
    lat: 17.7399,
    lng: 83.3031,
    radius: 500,
    category: "Clothing",
    offer: "Season sale — 20% off!",
  },
  {
    id: 3,
    name: "Green Valley Spa",
    lat: 17.7385,
    lng: 83.3051,
    radius: 400,
    category: "Beauty & Spa",
    offer: "Relaxation Massage @ 499/-",
  },
  {
    id: 4,
    name: "Apollo Hospital",
    lat: 17.7401,
    lng: 83.3018,
    radius: 700,
    category: "Health & Hospitals",
    offer: "Free health check-up camp",
  },
  {
    id: 5,
    name: "Medical Point",
    lat: 17.7391,
    lng: 83.3045,
    radius: 250,
    category: "Medical Shops",
    offer: "Up to 8% discount on medicines",
  },
];

const CATEGORIES = [
  "All",
  "Food",
  "Clothing",
  "Beauty & Spa",
  "Health & Hospitals",
  "Medical Shops",
];

// Haversine distance in meters
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function HomeScreen() {
  const [userLoc, setUserLoc] = useState(null);
  const [category, setCategory] = useState("All");
  const [offers, setOffers] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);
  const enteredMerchantsRef = useRef(new Set()); // to avoid alert spam

  // 1) Fetch merchant offers (mock async – replace with real API/Firebase)
  useEffect(() => {
    async function fetchMerchants() {
      // TODO: replace with real fetch from Firebase
      // const snapshot = await getDocs(collection(db, "merchants"));
      // setAllMerchants(snapshot.docs.map(d => d.data()));
      setAllMerchants(MOCK_MERCHANTS);
    }
    fetchMerchants();
  }, []);

  // 2) Live geolocation tracking
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Error getting location:", err);
        alert("Please allow location access for nearby offers.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 3) Compute offers + trigger alerts on entry into geofence
  useEffect(() => {
    if (!userLoc || allMerchants.length === 0) return;

    const matchingOffers = [];

    allMerchants.forEach((m) => {
      if (category !== "All" && m.category !== category) return;

      const d = distanceMeters(userLoc.lat, userLoc.lng, m.lat, m.lng);

      if (d <= m.radius) {
        matchingOffers.push({ ...m, distance: Math.round(d) });

        // Alert only when user enters zone for the first time
        if (!enteredMerchantsRef.current.has(m.id)) {
          enteredMerchantsRef.current.add(m.id);
          alert(
            `🎉 You entered ${m.name}'s zone!\nOffer: ${m.offer}`
          );
        }
      } else {
        // If user leaves zone, allow future alert again
        if (enteredMerchantsRef.current.has(m.id)) {
          enteredMerchantsRef.current.delete(m.id);
        }
      }
    });

    setOffers(matchingOffers);
  }, [userLoc, category, allMerchants]);

  return (
    <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>
      <h2>OshirO – Customer Home</h2>

      {/* Location */}
      <div style={{ marginBottom: 12 }}>
        <strong>Your Location:</strong>
        {userLoc ? (
          <div>
            Lat: {userLoc.lat.toFixed(5)} | Lng: {userLoc.lng.toFixed(5)}
          </div>
        ) : (
          <div>Getting GPS location...</div>
        )}
      </div>

      {/* Category filter UI */}
      <h3>Categories</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "6px 10px",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              background: category === cat ? "#007bff" : "#e0e0e0",
              color: category === cat ? "#fff" : "#000",
              fontSize: 13,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Offers list */}
      <h3>
        {category === "All"
          ? "Nearby Offers"
          : `Nearby Offers in ${category}`}
      </h3>

      {offers.length === 0 && (
        <p>No offers inside your selected category & geofence right now.</p>
      )}

      {offers.map((offer) => (
        <div
          key={offer.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <strong>{offer.name}</strong> <br />
          <small>{offer.category}</small> <br />
          <span>📍 ~{offer.distance} m away</span>
          <br />
          <span>💥 {offer.offer}</span>
        </div>
      ))}
    </div>
  );
}
export default HomeScreen;
