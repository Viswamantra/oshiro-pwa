import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchOffersByMerchantIds } from "../../firebase/barrel";
import { createLead, LEAD_TYPES } from "../../firebase/leads";

/**
 * =========================================================
 * OFFER DETAILS – PHASE 2.7 (ENHANCED)
 * ---------------------------------------------------------
 * ✔ Correct offer loading
 * ✔ Lead created once on page open
 * ✔ Call / WhatsApp / Directions buttons
 * ✔ Mobile-first UI
 * =========================================================
 */

export default function OfferDetails() {
  const { merchantId } = useParams();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ======================
     CUSTOMER IDENTITY
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
          setOffers(data || []);
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
     AUTO LEAD – OFFER VIEW
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
      offerId: merchantId,
    });

    leadFiredRef.current = true;
  }, [merchantId, customerMobile, customerId, customerName]);

  return (
    <div style={styles.page}>
      {/* HEADER */}
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
                  <span style={styles.discountBadge}>
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

              {/* ACTION BUTTONS */}
              <div style={styles.actionRow}>
                {offer.merchantMobile && (
                  <a
                    href={`tel:${offer.merchantMobile}`}
                    style={styles.actionBtn}
                  >
                    📞 Call
                  </a>
                )}

                {offer.merchantMobile && (
                  <a
                    href={`https://wa.me/${offer.merchantMobile.replace(
                      "+",
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.actionBtn}
                  >
                    💬 WhatsApp
                  </a>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    offer.shopName
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.actionBtn}
                >
                  📍 Directions
                </a>
              </div>

              <div style={styles.tapHint}>
                👀 Viewing this offer notifies the merchant
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ======================
   STYLES
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

  actionRow: {
    display: "flex",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },

  actionBtn: {
    fontSize: 13,
    padding: "6px 10px",
    background: "#f1f5f9",
    borderRadius: 8,
    textDecoration: "none",
    color: "#111827",
    fontWeight: 500,
    border: "1px solid #e2e8f0",
  },

  tapHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 500,
  },
};