import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

export default function Categories() {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const categoriesRef = collection(db, "categories");

  /* ======================
     LOAD CATEGORIES
  ====================== */
  const loadCategories = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(categoriesRef);
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Load categories error:", err);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  /* ======================
     ADD CATEGORY
  ====================== */
  const addCategory = async () => {
    if (!name.trim()) {
      alert("Category name required");
      return;
    }

    try {
      await addDoc(categoriesRef, {
        name: name.trim(),
        isActive: true,
        createdAt: serverTimestamp(),
      });

      setName("");
      loadCategories();
    } catch (err) {
      console.error("Add category error:", err);
      alert("Failed to add category");
    }
  };

  /* ======================
     DELETE CATEGORY
  ====================== */
  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await deleteDoc(doc(db, "categories", id));
      loadCategories();
    } catch (err) {
      console.error("Delete category error:", err);
      alert("Failed to delete category");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Categories</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Category"
          style={{ padding: 6, marginRight: 6 }}
        />
        <button onClick={addCategory}>Add</button>
      </div>

      {loading ? (
        <p>Loading categories...</p>
      ) : (
        <ul>
          {categories.map((cat) => (
            <li key={cat.id} style={{ marginBottom: 6 }}>
              {cat.name}
              <button
                onClick={() => deleteCategory(cat.id)}
                style={{ marginLeft: 8 }}
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
