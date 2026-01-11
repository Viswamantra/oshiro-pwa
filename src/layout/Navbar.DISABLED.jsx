import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('to', '==', `${user.role}_${user.mobile}`), where('read', '==', false));
    const unsub = onSnapshot(q, snap => setUnread(snap.size));
    return () => unsub();
  }, [user]);

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          OshirO
        </Typography>

        {user && <Typography sx={{ mr: 2 }}>{user.role}</Typography>}

        {user ? (
          <>
            <IconButton color="inherit" component={Link} to="/notifications">
              <Badge badgeContent={unread} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Button color="secondary" variant="contained" onClick={logout}>Logout</Button>
          </>
        ) : (
          <Button color="secondary" variant="contained" component={Link} to="/login">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
