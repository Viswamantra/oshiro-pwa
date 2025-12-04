// src/pages/HomeScreen.jsx

import { useEffect, useState, useRef } from "react";
import LogoutBtn from "../components/LogoutBtn";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Fix marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ---------------- MOCK MERCHANTS ----------------
// Replace with Firebase later
const MOCK_MERCHANTS = [
  {
    id: 1,
    name: "Sri Sai Tiffins",
    lat: 17.7381,
    lng: 83.3012,
    radius: 300,
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
];

const CATEGORIES = [
  "All",
  "Food",
  "Clothing",
  "Beauty & Spa",
  "Health & Hospitals",
  "Medical Shops",
];

// Haversine
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HomeScreen() {
  const [userLoc, setUserLoc] = useState(null);
  const [category, setCategory] = useState("All");
  const [offers, setOffers] = useState([]);
  const [allMerchants, setAllMerchants] = useState([]);

  const enteredRef = useRef(new Set());

  // Protect route
  useEffect(() => {
    const role = localStorage.getItem("logged_role");
    if (role !== "customer") {
      alert("Please login as Customer");
      window.location.href = "/";
    }
  }, []);

  // Fetch merchants (mock)
  useEffect(() => {
    setAllMerchants(MOCK_MERCHANTS);
  }, []);

  // Live GPS
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setUserLoc({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
        });
      },
      () => alert("Please allow GPS access"),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Geofence check
  useEffect(() => {
    if (!userLoc || !allMerchants.length) return;

    const list = [];

    allMerchants.forEach((m) => {
      if (category !== "All" && category !== m.category) return;

      const d = distanceMeters(
        userLoc.lat,
        userLoc.lng,
        m.lat,
        m.lng
      );

      if (d <= m.radius) {
        list.push({ ...m, distance: Math.round(d
