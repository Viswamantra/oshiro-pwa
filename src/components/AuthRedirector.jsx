import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ROUTES } from "../constants/routes";
import { getActiveRole } from "../utils/activeRole";

/**
 * PUBLIC ROUTES — never blocked
 */
const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.MERCHANT_LOGIN,
  ROUTES.MERCHANT_REGISTER,
  ROUTES.CUSTOMER_LOGIN,
  ROUTES.ADMIN_LOGIN,
];

export default function AuthRedirector({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function guard() {
      const path = location.pathname;

      const mobile = localStorage.getItem("mobile");
      const activeRole = getActiveRole();

      /* ===============================
         0️⃣ Always allow public routes
      =============================== */
      if (PUBLIC_ROUTES.includes(path)) {
        setChecking(false);
        return;
      }

      /* ===============================
         1️⃣ NOT LOGGED IN
      =============================== */
      if (!mobile || !activeRole) {
        navigate(ROUTES.HOME, { replace: true });
        setChecking(false);
        return;
      }

      /* ===============================
         2️⃣ ADMIN (no Firestore)
      =============================== */
      if (activeRole === "admin") {
        setChecking(false);
        return;
      }

      /* ===============================
         3️⃣ MERCHANT
      =============================== */
      if (activeRole === "merchant") {
        const q = query(
          collection(db, "merchants"),
          where("mobile", "==", mobile)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          navigate(ROUTES.HOME, { replace: true });
          setChecking(false);
          return;
        }

        setChecking(false);
        return;
      }

      /* ===============================
         4️⃣ CUSTOMER
      =============================== */
      if (activeRole === "customer") {
        const ref = doc(db, "customers", mobile);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          navigate(ROUTES.HOME, { replace: true });
          setChecking(false);
          return;
        }

        setChecking(false);
        return;
      }

      setChecking(false);
    }

    guard();
  }, [location.pathname, navigate]);

  if (checking) return null;
  return children;
}
