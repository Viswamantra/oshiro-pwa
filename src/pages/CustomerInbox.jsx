import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
} from "@mui/material";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function CustomerInbox() {
  const stored = JSON.parse(localStorage.getItem("oshiro_user") || "{}");
  const customerId = stored.customerId;

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!customerId) return;

    const q = query(
      collection(db, "customer_alerts"),
      where("customerId", "==", customerId)
    );

    return onSnapshot(q, snap =>
      setMessages(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      )
    );
  }, [customerId]);

  const markAsRead = async id => {
    await updateDoc(doc(db, "customer_alerts", id), {
      read: true,
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">🔔 Inbox</Typography>
      <Divider sx={{ my: 2 }} />

      {messages.length === 0 && (
        <Typography>No messages yet</Typography>
      )}

      {messages.map(m => (
        <Card
          key={m.id}
          sx={{
            mb: 2,
            background: m.read ? "#fafafa" : "#e3f2fd",
            cursor: "pointer",
          }}
          onClick={() => !m.read && markAsRead(m.id)}
        >
          <CardContent>
            <Typography>{m.message}</Typography>
            <Typography variant="caption">
              {m.distanceMeters}m away
            </Typography>
            {!m.read && (
              <Chip
                label="NEW"
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
