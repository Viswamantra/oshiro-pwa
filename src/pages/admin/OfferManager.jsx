import React, { useEffect, useState } from "react";
import {
  Box, Paper, Grid, TextField, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Table, TableBody, TableCell,
  TableHead, TableRow, TablePagination,
  Select, MenuItem, InputLabel, FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { db } from "../../firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
} from "firebase/firestore";
import { sendNotification } from "../../utils/sendNotification";

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    merchantId: "",
    merchantMobile: "",
    shopName: "",
    title: "",
    discount: "",
    couponCode: "",
    expiryDate: "",
    category: "",
    active: true,
  };

  const [form, setForm] = useState(emptyForm);

  /* ---------- DATA ---------- */
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "offers"), (s) =>
      setOffers(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "merchants"), (s) =>
      setMerchants(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  const filtered = offers.filter((o) =>
    `${o.shopName} ${o.title}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleMerchantSelect = (id) => {
    const m = merchants.find((x) => x.id === id);
    if (!m) return;

    if (!m.lat || !m.lng) {
      alert("Merchant GPS not available. Cannot create offer.");
      return;
    }

    setForm((f) => ({
      ...f,
      merchantId: id,
      merchantMobile: m.mobile || "",
      shopName: m.shopName || "",
      category: m.category || "",
    }));
  };

  const handleSave = async () => {
    if (!form.merchantId || !form.title) {
      alert("Merchant and offer title are required");
      return;
    }

    const payload = {
      merchantId: form.merchantId,
      merchantMobile: form.merchantMobile,
      shopName: form.shopName,
      title: form.title,
      discount: Number(form.discount || 0),
      couponCode: form.couponCode || "",
      expiryDate: form.expiryDate || "",
      category: form.category || "",
      active: true,
      createdAt: new Date(),
    };

    if (editing) {
      await updateDoc(doc(db, "offers", editing), payload);
    } else {
      await addDoc(collection(db, "offers"), payload);
      try {
        await sendNotification(
          `merchant_${form.merchantMobile}`,
          "merchant",
          "New Offer Live",
          form.title
        );
      } catch {
        /* ignore notification errors */
      }
    }

    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <Box>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Offers</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setForm(emptyForm);
            setEditing(null);
            setOpen(true);
          }}
        >
          Add Offer
        </Button>
      </Grid>

      <TextField
        fullWidth
        sx={{ mt: 2, mb: 2 }}
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.shopName}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>{o.discount}%</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setEditing(o.id);
                        setForm(o);
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => deleteDoc(doc(db, "offers", o.id))}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPageOptions={[10]}
        />
      </Paper>

      {/* ---------- DIALOG ---------- */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Merchant</InputLabel>
            <Select
              value={form.merchantId}
              onChange={(e) => handleMerchantSelect(e.target.value)}
            >
              {merchants.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.shopName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Offer Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Discount (%)"
            type="number"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
          />

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Coupon Code (optional)"
            value={form.couponCode}
            onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
          />

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Expiry Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
