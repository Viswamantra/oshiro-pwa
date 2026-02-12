import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HoverActions from "../../components/HoverActions";
import { fetchActiveCategories } from "../../firebase/categories";

/**
 * =========================================================
 * MERCHANT CARD – FINAL PRODUCTION VERSION
 * ---------------------------------------------------------
 * ✔ Shop Thumbnail Image Support
 * ✔ Category Icon Support
 * ✔ Backward Compatible
 * ✔ Safe Rendering Guards
 * ✔ Mobile Friendly UI
 * =========================================================
 */

export default function MerchantCard({ merchant }) {
  const navigate = useNavigate();

  const [categoryIcon, setCategoryIcon] = useState("🏬");

  if (!merchant) return null;

  const {
    id,
    shop_name,
    category,
    categoryId,
    mobile,
    location,
    shopImageUrl,
  } = merchant;

  /* ======================
     LOAD CATEGORY ICON
  ====================== */
  useEffect(() => {
    let mounted = true;

    async function loadCategoryIcon() {
      try {
        const cats = await fetchActiveCategories();

        let matched;

        // Prefer categoryId
        if (categoryId) {
          matched = cats.find((c) => c.id === categoryId);
        }

        // Fallback to category name
        if (!matched && category) {
          matched = cats.find(
            (c) =>
              c.name?.toLowerCase() === category?.toLowerCase()
          );
        }

        if (mounted && matched?.icon) {
          // If using emoji icons store directly
          setCategoryIcon(matched.icon);
        }
      } catch (err) {
        console.error("Category icon load failed", err);
      }
    }

    loadCategoryIcon();
    return () => (mounted = false);
  }, [categoryId, category]);

  /* ======================
     HARD GUARDS
  ====================== */
  if (!id || !shop_name || !category) return null;

  /* ======================
     NAVIGATION
  ====================== */
  const openDetails = () => {
    navigate(`/customer/merchant/${id}`);
  };

  /* ======================
     UI
  ====================== */
  return (
    <div
      className="merchant-card"
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${shop_name}`}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        marginBottom: 12,
        borderRadius: 12,
        background: "#fff",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      {/* ======================
          LEFT SIDE (IMAGE + INFO)
      ====================== */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* SHOP IMAGE */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            overflow: "hidden",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          {shopImageUrl ? (
            <img
              src={shopImageUrl}
              alt={shop_name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            categoryIcon
          )}
        </div>

        {/* SHOP INFO */}
        <div>
          <h4 style={{ margin: 0 }}>{shop_name}</h4>

          <span
            style={{
              fontSize: 13,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{categoryIcon}</span>
            {category}
          </span>
        </div>
      </div>

      {/* ======================
          ACTIONS
      ====================== */}
      <div
        role="presentation"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <HoverActions
          mobile={mobile}
          lat={location?.lat}
          lng={location?.lng}
        />
      </div>
    </div>
  );
}
