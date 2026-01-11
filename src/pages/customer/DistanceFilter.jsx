import React from "react";

/**
 * =========================================================
 * DISTANCE FILTER (CUSTOMER SIDE)
 * ---------------------------------------------------------
 * ✔ Simple distance selector
 * ✔ Returns distance in meters
 * ✔ Mobile-friendly
 * =========================================================
 */

export default function DistanceFilter({
  value = 10000,
  onSelect,
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ marginRight: 6 }}>Distance</label>

      <select
        value={value}
        onChange={(e) => onSelect(Number(e.target.value))}
        style={{ padding: 6 }}
      >
        <option value={300}>300 m</option>
        <option value={1000}>1 km</option>
        <option value={3000}>3 km</option>
        <option value={5000}>5 km</option>
        <option value={10000}>10 km</option>
      </select>
    </div>
  );
}
