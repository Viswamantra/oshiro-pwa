import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { loginWithPin } = useAuth();

  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState("MOBILE"); 
  // MOBILE | LOGIN | SET_PIN
  const [loading, setLoading] = useState(false);

  /* =========================
     VALIDATION
  ========================= */
  const isValidMobile = /^\d{10}$/.test(mobile);
  const isValidPin = /^\d{4}$/.test(pin);

  /* =========================
     CHECK USER EXISTS
  ========================= */
  const handleMobileSubmit = async () => {
    if (!isValidMobile) {
      alert("Enter valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const checkUser = httpsCallable(functions, "checkUserExists");
      const res = await checkUser({ mobile });

      if (res.data.exists) {
        setStep("LOGIN");
      } else {
        setStep("SET_PIN");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to check user");
    }
    setLoading(false);
  };

  /* =========================
     SET PIN (NEW USER)
  ========================= */
  const handleSetPin = async () => {
    if (!isValidPin) {
      alert("PIN must be exactly 4 digits");
      return;
    }

    setLoading(true);
    try {
      const setPin = httpsCallable(functions, "setUserPin");
      const res = await setPin({
        mobile,
        pin,
        role: "customer", // merchant can be upgraded later by admin
      });

      if (res.data.success) {
        alert("PIN set successfully. Please login.");
        setPin("");
        setStep("LOGIN");
      } else {
        alert(res.data.message || "Failed to set PIN");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to set PIN");
    }
    setLoading(false);
  };

  /* =========================
     LOGIN (EXISTING USER)
  ========================= */
  const handleLogin = async () => {
    if (!isValidPin) {
      alert("Enter valid 4-digit PIN");
      return;
    }

    setLoading(true);
    const res = await loginWithPin(mobile, pin);
    if (!res.success) alert(res.message);
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper sx={{ p: 4, width: 380 }}>
        <Typography variant="h6" mb={2}>
          Customer / Merchant Login
        </Typography>

        {/* MOBILE NUMBER */}
        <TextField
          label="Mobile Number"
          fullWidth
          margin="normal"
          value={mobile}
          inputProps={{ maxLength: 10 }}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          disabled={step !== "MOBILE"}
        />

        {step === "MOBILE" && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleMobileSubmit}
            disabled={loading}
          >
            Continue
          </Button>
        )}

        {step !== "MOBILE" && (
          <>
            <Divider sx={{ my: 2 }} />

            <TextField
              label="4-digit PIN"
              type="password"
              fullWidth
              margin="normal"
              value={pin}
              inputProps={{ maxLength: 4 }}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />

            {step === "SET_PIN" && (
              <Button
                fullWidth
                variant="contained"
                onClick={handleSetPin}
                disabled={loading}
              >
                Set PIN
              </Button>
            )}

            {step === "LOGIN" && (
              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
              >
                Login
              </Button>
            )}
          </>
        )}

        <Typography
          variant="caption"
          display="block"
          mt={2}
          color="text.secondary"
        >
          Same login works for both customers and merchants.
        </Typography>
      </Paper>
    </Box>
  );
}
