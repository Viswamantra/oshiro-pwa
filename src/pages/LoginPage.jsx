import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const { loginWithOtp } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const res = await loginWithOtp(mobile, otp);
    if (!res.success) setErr(res.message);
  };

  return (
    <Box sx={{ maxWidth: 380, mx: 'auto', mt: 8, p:3, bgcolor:'#fff', borderRadius:2 }}>
      <Typography variant="h6" sx={{ mb:2 }}>Login with OTP</Typography>
      <form onSubmit={submit}>
        <TextField label="Mobile" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g,'' ).slice(0,10))} fullWidth sx={{ mb:2 }} />
        <TextField label="OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,4))} fullWidth sx={{ mb:2 }} />
        {err && <Typography color="error" sx={{ mb:2 }}>{err}</Typography>}
        <Button type="submit" variant="contained" color="primary" fullWidth>Login</Button>
      </form>
      <Typography sx={{ mt:2, fontSize: 13 }}>New merchant? <Link to="/merchant-register">Request registration here</Link></Typography>
      <Typography sx={{ mt:1, fontSize: 12, color:"#666" }}>Test OTP: 2345</Typography>
    </Box>
);
}
