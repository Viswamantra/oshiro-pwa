import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOffersByMerchantIds } from "../../firebase/barrel";
import { createLead, LEAD_TYPES } from "../../firebase/leads";

/**
 * =========================================================
 * OFFER DETAILS – PHASE 2.7 (ROW 1)
 * ---------------------------------------------------------
 * ✔ Lead created ONCE on page open
 * ✔ Session-guarded (no double fire)
 * ✔ Uses central createLead()
 * ✔ Safe for dedup & notifications
 * =========================================================
 */

export default function OfferDetails() {
  const { merchantId } = useParams();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================
     CUSTOMER IDENTITY
     (SINGLE SOURCE)
  ====================== */
  const customerMobile =
    localStorage.getItem("customerMobile") ||
    localStorage.getItem("mobile") ||
    null;

  const customerId =
    localStorage.getItem("customerId") || null;

  const customerName =
    localStorage.getItem("customerName") || "";

  /* ======================
     SESSION GUARD
     (ONE LEAD PER OPEN)
  ====================== */
  const leadFiredRef = useRef(false);

  /* ======================
     LOAD OFFERS
  ====================== */
  useEffect(() => {
    let mounted = true;

    async function loadOffers() {
      try {
        setLoading(true);
        const data = await fetchOffersByMerchantIds([
          merchantId,
        ]);

        if (mounted) {
          setOffers(data?.[merchantId] || []);
        }
      } catch (err) {
        console.error("Failed to load offers:", err);
        mounted && setOffers([]);
      } finally {
        mounted && setLoading(false);
      }
    }

    if (merchantId) loadOffers();
    return () => (mounted = false);
  }, [merchantId]);

  /* ======================
     PHASE 2.7 – ROW 1
     OFFER VIEW LEAD
  ====================== */
  useEffect(() => {
    if (
      !merchantId ||
      !customerMobile ||
      leadFiredRef.current
    )
      return;

    createLead({
      merchantId,
      customerMobile,
      customerId,
      customerName,
      type: LEAD_TYPES.OFFER_VIEW,
      source: "customer",
      offerId: merchantId, // merchant-scoped view
    });

    leadFiredRef.current = true;
  }, [merchantId, customerMobile, customerId, customerName]);

  return (
    <div style={styles.page}>
      {/* STICKY HEADER */}
      <header style={styles.header}>
        <button
          onClick={() => navigate(-1)}
          style={styles.backBtn}
        >
          ←
        </button>
        <h2 style={styles.title}>Offers</h2>
      </header>

      {/* CONTENT */}
      <div style={styles.content}>
        {loading && (
          <p style={styles.helper}>Loading offers…</p>
        )}

        {!loading && offers.length === 0 && (
          <p style={styles.helper}>
            No active offers available.
          </p>
        )}

        {!loading &&
          offers.map((offer) => (
            <div key={offer.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.offerTitle}>
                  {offer.title}
                </h3>

                {offer.discountText && (
                  <span
                    style={styles.discountBadge}
                  >
                    {offer.discountText}% OFF
                  </span>
                )}
              </div>

              {offer.description && (
                <p style={styles.desc}>
                  {offer.description}
                </p>
              )}

              {offer.expiryDate?.toDate && (
                <p style={styles.expiry}>
                  ⏰ Valid till{" "}
                  {offer.expiryDate
                    .toDate()
                    .toLocaleDateString()}
                </p>
              )}

              <div style={styles.tapHint}>
                👀 Viewing this offer notifies the
                merchant
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ======================
   STYLES – MOBILE FIRST
====================== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#ffffff",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  },

  backBtn: {
    border: "none",
    background: "#f1f5f9",
    width: 36,
    height: 36,
    borderRadius: "50%",
    fontSize: 18,
    cursor: "pointer",
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
  },

  content: {
    padding: 16,
    maxWidth: 720,
    margin: "0 auto",
  },

  helper: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 20,
  },

  card: {
    background: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    boxShadow: "0 6px 20px rgba(0,0,0,.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  offerTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111827",
  },

  discountBadge: {
    background: "#16a34a",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  desc: {
    fontSize: 14,
    marginTop: 8,
    color: "#374151",
    lineHeight: 1.45,
  },

  expiry: {
    fontSize: 12,
    marginTop: 10,
    color: "#6b7280",
  },

  tapHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 500,
  },
};
