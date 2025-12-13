import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);
const DEFAULT_OTP = '2345';
const ADMIN_MOBILE = '7386361725';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const loginWithOtp = async (mobile, otp) => {
    if (!/^\d{10}$/.test(mobile)) return { success: false, message: 'Mobile must be 10 digits' };
    if (otp !== DEFAULT_OTP) return { success: false, message: 'Invalid OTP' };

    let role = 'customer';
    if (mobile === ADMIN_MOBILE) role = 'admin';
    else {
      try {
        const q = query(collection(db, 'merchants'), where('mobile', '==', mobile), where('status', '==', 'approved'));
        const snap = await getDocs(q);
        if (!snap.empty) role = 'merchant';
      } catch (e) {
        console.error('Auth merchant check error', e);
      }
    }

    const loggedInUser = { mobile, role };
    setUser(loggedInUser);

    if (role === 'admin') navigate('/admin');
    else if (role === 'merchant') navigate('/merchant');
    else navigate('/customer');

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    navigate('/login');
  };

  return <AuthContext.Provider value={{ user, loginWithOtp, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
