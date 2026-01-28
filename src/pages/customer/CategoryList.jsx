import React from "react";

/**
 * =========================================================
 * CATEGORY LIST (CUSTOMER)
 * ---------------------------------------------------------
 * ✔ Horizontal scroll
 * ✔ Single-select
 * ✔ Controlled by parent
 * ✔ Firestore-ready (dummy data now)
 * =========================================================
 */

// 🔹 TEMP DUMMY DATA (replace with Firestore later)
const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "grocery", name: "Grocery" },
  { id: "restaurant", name: "Restaurant" },
  { id: "pharmacy", name: "Pharmacy" },
  { id: "fashion", name: "Fashion" },
  { id: "electronics", name: "Electronics" },
];

export default function CategoryList({
  selectedCategory,
  onSelect,
}) {
  return (
    <div>
      <h4 style={styles.heading}>Categories</h4>

      <div style={styles.list}>
        {CATEGORIES.map((cat) => {
          const isActive =
            selectedCategory === cat.id ||
            (!selectedCategory && cat.id === "all");

          return (
            <div
              key={cat.id}
              onClick={() =>
                onSelect(cat.id === "all" ? null : cat.id)
              }
              style={{
                ...styles.chip,
                ...(isActive ? styles.active : {}),
              }}
            >
              {cat.name}
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
    overflowX: "auto",
    paddingBottom: 4,
  },
  chip: {
    padding: "8px 14px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
  active: {
    background: "#2563eb",
    color: "#ffffff",
  },
};
