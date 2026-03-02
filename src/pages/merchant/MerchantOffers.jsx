import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import {
  createOffer,
  fetchMerchantOffers,
  deleteOffer,
  autoExpireOffers,
  fetchActiveCategories,
} from "../../firebase/barrel";

/**
 * =========================================================
 * MERCHANT OFFERS – FULL PRODUCTION VERSION
 * =========================================================
 */

export default function MerchantOffers() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  /* ================= AUTH ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!user) return;
    loadOffers();
    loadCategories();
    autoExpireOffers(user.uid);
  }, [user]);

  async function loadOffers() {
    const data = await fetchMerchantOffers(user.uid);
    setOffers(data);
  }

  async function loadCategories() {
    const cats = await fetchActiveCategories();
    setCategories(cats);
  }

  /* ================= CREATE OFFER ================= */
  async function handleCreate() {
    if (!title || !discountText || !categoryId || !expiryDate) {
      alert("Please fill all required fields");
      return;
    }

    const selectedCategory = categories.find(c => c.id === categoryId);

    await createOffer({
      ownerId: user.uid,
      title,
      description,
      discountText,
      categoryId,
      categoryName: selectedCategory?.name || "",
      expiryDate: new Date(expiryDate),
    });

    setTitle("");
    setDescription("");
    setDiscountText("");
    setCategoryId("");
    setExpiryDate("");

    loadOffers();
  }

  /* ================= DELETE OFFER ================= */
  async function handleDelete(id) {
    await deleteOffer(id);
    loadOffers();
  }

  /* ================= AUTH STATES ================= */
  if (checkingAuth) return <p>Loading...</p>;

  if (!user) {
    return (
      <div style={styles.center}>
        <p style={{ color: "red" }}>Merchant not logged in</p>
        <button onClick={() => navigate("/merchant/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div style={styles.page}>
      <h2>Create Offer</h2>

      <input
        placeholder="Offer Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Discount (e.g 20%)"
        value={discountText}
        onChange={(e) => setDiscountText(e.target.value)}
        style={styles.input}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={styles.textarea}
      />

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        style={styles.input}
      >
        <option value="">Select Category</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleCreate} style={styles.button}>
        Create Offer
      </button>

      <hr />

      <h3>Your Offers</h3>

      {offers.length === 0 && <p>No offers yet</p>}

      {offers.map(offer => (
        <div key={offer.id} style={styles.card}>
          <strong>{offer.title}</strong>
          <div>{offer.discountText}</div>
          <div>Status: {offer.status}</div>
          <button onClick={() => handleDelete(offer.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: { padding: 20 },
  center: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    display: "block",
    marginBottom: 10,
    padding: 8,
    width: "100%",
    maxWidth: 400,
  },
  textarea: {
    display: "block",
    marginBottom: 10,
    padding: 8,
    width: "100%",
    maxWidth: 400,
    height: 80,
  },
  button: {
    padding: 10,
    marginBottom: 20,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  card: {
    border: "1px solid #ddd",
    padding: 10,
    marginBottom: 10,
    maxWidth: 400,
  },
};