// src/pages/HomeScreen.jsx
import React, { useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import useGeoLocation from "../hooks/useGeoLocation.js";
import useGeofence from "../hooks/useGeofence.js";
import MerchantCard from "../components/merchants/MerchantCard.jsx";

// Fix default marker icon in Vite + Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORIES = [
  "Food",
  "Clothing",
  "Beauty & Spa",
  "Health & Hospitals",
  "Medical Shops",
];

export default function HomeScreen() {
  const { position, error } = useGeoLocation();

  // TODO: later replace with Firebase merchants
  const merchants = useMemo(
    () => [
      {
        id: "m1",
        name: "Sai Tiffins",
        lat: position?.lat ? position.lat + 0.0007 : 17.448,
        lng: position?.lng ? position.lng + 0.0007 : 78.390,
        radiusMeters: 200,
        category: "Food",
        offer: "Flat 20% off breakfast",
      },
      {
        id: "m2",
        name: "Wedding Collections",
        lat: position?.lat ? position.lat - 0.0009 : 17.447,
        lng: position?.lng ? position.lng - 0.0004 : 78.3885,
        radiusMeters: 300,
        category: "Clothing",
        offer: "Off-season saree sale 40%",
      },
    ],
    [position]
  );

  const { activeMerchants } = useGeofence(position, merchants);

  const center = position
    ? [position.lat, position.lng]
    : [17.447, 78.39]; // fallback demo center

  return (
    <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Hi, Shopper 👋</h2>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
        Get instant alerts when you enter offers in your area.
      </p>

      {error && (
        <div
          style={{
            background: "#FFECEC",
            color: "#CC0000",
            padding: "0.5rem",
            borderRadius: "6px",
            fontSize: "0.8rem",
          }}
        >
          Location Error: {error}
        </div>
      )}

      {/* Categories */}
      <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            style={{
              display: "inline-block",
              padding: "0.4rem 0.7rem",
              marginRight: "0.4rem",
              borderRadius: "16px",
              border: "1px solid #ddd",
              fontSize: "0.8rem",
              background: "#fff",
            }}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Map */}
      <div style={{ height: "320px", borderRadius: "10px", overflow: "hidden" }}>
        <MapContainer center={center} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {position && (
            <Marker position={[position.lat, position.lng]}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {merchants.map((m) => (
            <React.Fragment key={m.id}>
              <Circle
                center={[m.lat, m.lng]}
                radius={m.radiusMeters}
                pathOptions={{ color: "#007AFF", fillOpacity: 0.12 }}
              />
              <Marker position={[m.lat, m.lng]}>
                <Popup>
                  <strong>{m.name}</strong>
                  <br />
                  {m.offer}
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Active geofences / offers */}
      <div>
        <h3 style={{ fontSize: "1rem" }}>Nearby Offers</h3>
        {activeMerchants.length === 0 && (
          <div style={{ fontSize: "0.85rem", color: "#777" }}>
            Move into a shopping area to see live offers.
          </div>
        )}
        {merchants.map((m) => {
          const isInside = !!activeMerchants.find((a) => a.id === m.id);
          return <MerchantCard key={m.id} merchant={m} isInside={isInside} />;
        })}
      </div>
    </div>
  );
}
