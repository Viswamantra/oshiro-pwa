/**
 * =========================================================
 * MAP & COMMUNICATION LINKS
 * ---------------------------------------------------------
 * Centralized helpers for Call, Google Maps, WhatsApp
 * =========================================================
 */

/* ======================
   PHONE
====================== */
export function getCallLink(mobile) {
  if (!mobile) return "#";
  return `tel:${mobile}`;
}

/* ======================
   GOOGLE MAPS
====================== */
export function getGoogleMapsLink(lat, lng) {
  if (lat == null || lng == null) return "#";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/* ======================
   WHATSAPP
====================== */
export function getWhatsAppLink(mobile, countryCode = "91") {
  if (!mobile) return "#";
  return `https://wa.me/${countryCode}${mobile}`;
}
