import React from "react";

/**
 * =========================================================
 * DISTANCE FILTER (CUSTOMER) — UX FIXED
 * ---------------------------------------------------------
 * ✔ Includes 300 meters (hyperlocal)
 * ✔ Uses KM internally (0.3)
 * ✔ Clear visual hierarchy
 * ✔ Controlled by parent
 * ✔ Mobile-first UX
 * =========================================================
 */

// UX-first distances (value in KM)
const DISTANCES = [
  { label: "300 m", value: 0.3 },
  { label: "1 km", value: 1 },
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
];

export default function DistanceFilter({ value, onChange }) {
  return (
    <div>
      <h4 style={styles.heading}>Distance</h4>

      <div style={styles.list}>
        {DISTANCES.map((d) => {
          const isActive = value === d.value;

          return (
            <button
              key={d.value}
              onClick={() => onChange(d.value)}
              style={{
                ...styles.chip,
                ...(isActive ? styles.active : {}),
              }}
              aria-pressed={isActive}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ======================
   STYLES (MOBILE-FIRST)
====================== */
const styles = {
  heading: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: "#0f172a",
  },

  list: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  chip: {
    padding: "8px 16px",
    borderRadius: 999,
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    userSelect: "none",
    border: "none",
    outline: "none",
    transition: "all 0.2s ease",
  },

  active: {
    background: "#16a34a",
    color: "#ffffff",
    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.35)",
  },
};
