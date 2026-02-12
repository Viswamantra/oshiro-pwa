import React, { useEffect, useState } from "react";
import { fetchActiveCategories } from "../firebase/categories";

/**
 * =====================================================
 * GLOBAL CATEGORY SELECTOR
 * -----------------------------------------------------
 * ✔ Live Firestore Categories
 * ✔ Active Only
 * ✔ Sort Order Support
 * ✔ Future Icon Ready
 * ✔ Backward Safe
 * =====================================================
 */

export default function CategorySelector({
  value,
  onChange,
  includeAll = true,
}) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    async function load() {
      try {
        const list = await fetchActiveCategories();
        setCategories(list || []);
      } catch (err) {
        console.error("Category load failed", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /* =========================
     UI
  ========================= */
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
      style={{
        padding: 8,
        minWidth: 200,
        cursor: "pointer",
        borderRadius: 6,
        border: "1px solid #ccc",
        background: loading ? "#f5f5f5" : "white",
      }}
    >
      {includeAll && <option value="">All Categories</option>}

      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}

      {!loading && categories.length === 0 && (
        <option value="">No Categories Found</option>
      )}
    </select>
  );
}
