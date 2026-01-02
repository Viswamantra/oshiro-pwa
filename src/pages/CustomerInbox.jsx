import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export default function CustomerInbox() {
  const { user } = useAuth(); // customer auth
  const customerId = user?.uid;

  const [messages, setMessages] = useState([]);

  /* ============================
     LOAD CUSTOMER MESSAGES
  ============================ */
  useEffect(() => {
    if (!customerId) return;

    const q = query(
      collection(db, "merchant_messages"),
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const now = Timestamp.now();

      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((m) => !m.expiresAt || m.expiresAt.toMillis() > now.toMillis());

      setMessages(rows);
    });
  }, [customerId]);

  /* ============================
     MARK AS READ
  ============================ */
  const markRead = async (id) => {
    await updateDoc(doc(db, "merchant_messages", id), {
      read: true,
    });
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        📥 Nearby Offers
      </Typography>

      {messages.length === 0 && (
        <Typography color="text.secondary">
          No offers right now
        </Typography>
      )}

      {messages.map((m) => (
        <Card
          key={m.id}
          sx={{
            mb: 2,
            backgroundColor: m.read ? "#fafafa" : "#e3f2fd",
            cursor: "pointer",
          }}
          onClick={() => markRead(m.id)}
        >
          <CardContent>
            <Typography variant="body1">
              🎁 {m.message}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Received just now
            </Typography>

            {!m.read && (
              <Box mt={1}>
                <Chip label="NEW" color="primary" size="small" />
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
