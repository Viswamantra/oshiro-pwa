import { ADMIN_MOBILE, ADMIN_PASSWORD } from "./constants";

export function adminLogin(mobile, password) {
  if (mobile === ADMIN_MOBILE && password === ADMIN_PASSWORD) {
    return { role: "admin", mobile };
  }
  throw new Error("Invalid admin credentials");
}
