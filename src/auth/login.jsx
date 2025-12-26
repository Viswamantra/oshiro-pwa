import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";

export default function Login() {
  return (
    <Box sx={{ maxWidth: 360, mx: "auto", mt: 6 }}>
      <Typography variant="h6" align="center">
        Login Screen
      </Typography>

      <TextField label="Mobile Number" fullWidth margin="normal" />
      <TextField label="OTP" fullWidth margin="normal" />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
      />

      <Button fullWidth variant="contained" sx={{ mt: 2 }}>
        CONTINUE
      </Button>
    </Box>
  );
}
