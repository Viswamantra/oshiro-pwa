/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Merchant Leads (My Leads)
 * Bulk delete implemented & tested
 * Do not modify during Phase 2.7
 */

import React, { useEffect, useState } from "react";
import { fetchLeadsByMerchant } from "../../firebase/barrel";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * =========================================================
 * MERCHANT LEADS – MOBILE FIRST
 * ---------------------------------------------------------
 * ✔ Shows customer leads
 * ✔ Sorted latest first
 * ✔ Select multiple leads
 * ✔ Bulk delete (merchant-owned only)
 * ✔ Clean & readable
 * =========================================================
 */

export default function MerchantLeads() {
  const merchant =
    JSON.parse(localStorage.getItem("merchant")) || {};
  const merchantId = merchant.id;

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadLeads() {
      try {
        setLoading(true);
        const data = await fetchLeadsByMerchant(merchantId);
        mounted && setLeads(data);
      } catch (err) {
        console.error(err);
        mounted && setLeads([]);
      } finally {
        mounted && setLoading(false);
      }
    }

    loadLeads();
    return () => (mounted = false);
  }, [merchantId]);

  /* ======================
     SELECTION HANDLERS
  ====================== */

  const toggleLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
    }
  };

  /* ======================
     BULK DELETE
  ====================== */

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

    const ok = window.confirm(
      `Delete ${selectedLeads.length} selected lead(s)?`
    );
    if (!ok) return;

    try {
      const batch = writeBatch(db);

      selectedLeads.forEach((leadId) => {
        const ref = doc(db, "leads", leadId);
        batch.delete(ref);
      });

      await batch.commit();

      // Update UI instantly
      setLeads((prev) =>
        prev.filter((l) => !selectedLeads.includes(l.id))
      );
      setSelectedLeads([]);

      alert("Selected leads deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete leads");
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Customer Leads</h2>

      {/* ACTION BAR */}
      {!loading && leads.length > 0 && (
        <div style={styles.actions}>
          <label style={styles.selectAll}>
            <input
              type="checkbox"
              checked={
                leads.length > 0 &&
                selectedLeads.length === leads.length
              }
              onChange={toggleSelectAll}
            />{" "}
            Select All
          </label>

          <button
            onClick={handleBulkDelete}
            disabled={selectedLeads.length === 0}
            style={{
              ...styles.deleteBtn,
              opacity:
                selectedLeads.length === 0 ? 0.5 : 1,
            }}
          >
            Delete Selected ({selectedLeads.length})
          </button>
        </div>
      )}

      {loading && (
        <p style={styles.helper}>Loading leads…</p>
      )}

      {!loading && leads.length === 0 && (
        <p style={styles.helper}>
          No leads received yet.
        </p>
      )}

      {!loading &&
        leads.map((lead) => (
          <div key={lead.id} style={styles.card}>
            <div style={styles.cardRow}>
              <input
                type="checkbox"
                checked={selectedLeads.includes(lead.id)}
                onChange={() => toggleLead(lead.id)}
              />

              <div style={{ flex: 1 }}>
                <div style={styles.name}>
                  {lead.customerName || "Customer"}
                </div>

                <div style={styles.mobile}>
                  📞 {lead.customerMobile}
                </div>

                <div style={styles.meta}>
                  {lead.createdAt?.toDate
                    ? lead.createdAt
                        .toDate()
                        .toLocaleString()
                    : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

/* ======================
   STYLES – MOBILE FIRST
====================== */
const styles = {
  page: {
    padding: 16,
    maxWidth: 720,
    margin: "0 auto",
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 16,
  },

  helper: {
    fontSize: 14,
    color: "#6b7280",
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },

  selectAll: {
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  deleteBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },

  card: {
    background: "#ffffff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: "0 4px 14px rgba(0,0,0,.08)",
  },

  cardRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },

  name: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },

  mobile: {
    fontSize: 14,
    marginBottom: 6,
  },

  meta: {
    fontSize: 12,
    color: "#6b7280",
  },
};
