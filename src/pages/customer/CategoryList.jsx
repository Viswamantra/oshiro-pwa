import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/index.js";

/**
 * =========================================================
 * CATEGORY LIST (CUSTOMER SIDE)
 * ---------------------------------------------------------
 * ✔ Fetches ACTIVE categories only
 * ✔ Displays category NAME in UI
 * ✔ Sends categoryId (doc.id) on select
 * ✔ Fixes Food / No merchants found issue
 * =========================================================
 */

export default function CategoryList({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const q = query(
          collection(db, "categories"),
          where("status", "==", "active")
        );

        const snapshot = await getDocs(q);

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,            // ✅ IMPORTANT: categoryId
          name: doc.data().name // UI label only
        }));

        setCategories(list);
      } catch (err) {
        console.error("Failed to load categories", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label htmlFor="category-select">Category</label>

      <select
        id="category-select"
        disabled={loading}
        defaultValue=""
        onChange={(e) => onSelect(e.target.value)}   // ✅ sends ID
        style={{
          padding: 6,
          minWidth: 160,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        <option value="">All</option>

        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
