import React from "react";

/**
 * =========================================================
 * DISTANCE FILTER (CUSTOMER)
 * ---------------------------------------------------------
 * ✔ Simple radius selector
 * ✔ Controlled by parent
 * ✔ Mobile-first UX
 * =========================================================
 */

const DISTANCES = [1, 3, 5, 10]; // in KM

export default function DistanceFilter({ value, onChange }) {
  return (
    <div>
      <h4 style={styles.heading}>Distance</h4>

      <div style={styles.list}>
        {DISTANCES.map((km) => {
          const isActive = value === km;

          return (
            <div
              key={km}
              onClick={() => onChange(km)}
              style={{
                ...styles.chip,
                ...(isActive ? styles.active : {}),
              }}
            >
              {km} km
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================
   STYLES
====================== */
const styles = {
  heading: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
  },
  list: {
    display: "flex",
    gap: 10,
  },
  chip: {
    padding: "8px 14px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    userSelect: "none",
  },
  active: {
    background: "#16a34a",
    color: "#ffffff",
  },
};
