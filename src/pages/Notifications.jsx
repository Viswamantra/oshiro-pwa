import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Box, Typography, Button } from '@mui/material';

export default function Notifications() {
  const { user } = useAuth();
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('to', '==', `${user.role}_${user.mobile}`));
    const unsub = onSnapshot(q, snap => {
      setList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const markRead = async (id) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Notifications</Typography>
      {list.length === 0 && <Typography sx={{ mt:2 }}>No notifications</Typography>}
      {list.map(n => (
        <Box key={n.id} sx={{ mt:2, p:2, bgcolor: n.read ? '#f3f3f3' : '#fff7ed', borderRadius: 1 }}>
          <Typography variant="subtitle1">{n.title}</Typography>
          <Typography variant="body2">{n.message}</Typography>
          {!n.read && <Button sx={{ mt:1 }} onClick={() => markRead(n.id)}>Mark as read</Button>}
        </Box>
      ))}
    </Box>
  );
}
