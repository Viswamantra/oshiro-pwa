import React from "react";

/**
 * =========================================================
 * DISTANCE SELECTOR – REUSABLE COMPONENT
 * ---------------------------------------------------------
 * Values are in METERS
 * Used in Customer Dashboard to filter nearby merchants
 * =========================================================
 */

const DISTANCE_OPTIONS = [
  { label: "300 m", value: 300 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 }
];

export default function DistanceSelector({ value = 3000, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ marginRight: 10 }}>
        Distance:
      </label>

      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {DISTANCE_OPTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
