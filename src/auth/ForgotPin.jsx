
import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

export default function ForgotPin() {
  const [phone, setPhone] = useState("");

  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography>Forgot PIN</Typography>

      <TextField
        label="Registered Mobile Number"
        fullWidth
        margin="normal"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <Button fullWidth variant="contained">
        Send OTP (SMS / WhatsApp)
      </Button>
    </Box>
  );
}
