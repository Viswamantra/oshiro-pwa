const ACTIVE_ROLE_KEY = "activeRole";

/**
 * Allowed roles (single source of truth)
 */
export const ROLES = {
  CUSTOMER: "customer",
  MERCHANT: "merchant",
  ADMIN: "admin",
};

/* =========================
   SET ACTIVE ROLE
========================= */
export function setActiveRole(role) {
  if (!Object.values(ROLES).includes(role)) {
    console.warn("❌ Invalid role attempted:", role);
    return;
  }

  localStorage.setItem(ACTIVE_ROLE_KEY, role);
}

/* =========================
   GET ACTIVE ROLE
========================= */
export function getActiveRole() {
  const role = localStorage.getItem(ACTIVE_ROLE_KEY);

  // 🧹 Auto-clean invalid roles
  if (!Object.values(ROLES).includes(role)) {
    clearActiveRole();
    return null;
  }

  return role;
}

/* =========================
   CLEAR ACTIVE ROLE
========================= */
export function clearActiveRole() {
  localStorage.removeItem(ACTIVE_ROLE_KEY);
}

/* =========================
   ROLE CHECK HELPERS
   (Optional but powerful)
========================= */
export function isAdmin() {
  return getActiveRole() === ROLES.ADMIN;
}

export function isMerchant() {
  return getActiveRole() === ROLES.MERCHANT;
}

export function isCustomer() {
  return getActiveRole() === ROLES.CUSTOMER;
}
