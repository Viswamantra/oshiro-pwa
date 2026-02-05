import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

export default function SetPin() {
  const [pin, setPin] = useState("");
  const navigate = useNavigate();
  const { state } = useLocation(); 
  // state = { mobile, role }

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      alert("PIN must be 4 digits");
      return;
    }

    const setPinFn = httpsCallable(functions, "setUserPin");
    const res = await setPinFn({
      mobile: state.mobile,
      pin,
      role: state.role,
    });

    if (res.data.success) {
      alert("PIN set successfully. Please login.");
      navigate("/login");
    } else {
      alert(res.data.message);
    }
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h6">Set 4-digit PIN</Typography>

        <TextField
          label="4-digit PIN"
          type="password"
          fullWidth
          margin="normal"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <Button fullWidth variant="contained" onClick={handleSetPin}>
          Set PIN
        </Button>
      </Paper>
    </Box>
  );
}
