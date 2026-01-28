import React from "react";
import MerchantOffersComponent from "../../components/merchant/MerchantOffers";

/**
 * =========================================================
 * MERCHANT OFFERS PAGE (SESSION-AWARE)
 * ---------------------------------------------------------
 * ✔ Loads merchant from localStorage
 * ✔ Blocks access if not logged in
 * ✔ Passes merchant correctly to Offer component
 * ✔ Fixes: New merchant cannot create offers
 * =========================================================
 */

export default function MerchantOffersPage() {
  const merchantRaw = localStorage.getItem("merchant");

  if (!merchantRaw) {
    return (
      <p style={{ padding: 20, color: "red" }}>
        Merchant not logged in
      </p>
    );
  }

  let merchant;
  try {
    merchant = JSON.parse(merchantRaw);
  } catch {
    return (
      <p style={{ padding: 20, color: "red" }}>
        Invalid merchant session
      </p>
    );
  }

  if (!merchant.id) {
    return (
      <p style={{ padding: 20, color: "red" }}>
        Merchant session missing ID
      </p>
    );
  }

  return <MerchantOffersComponent merchant={merchant} />;
}
