import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { db } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { sendNotification } from "../../utils/sendNotification";

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    merchantId: "",
    merchantMobile: "",
    shopName: "",
    categoryName: "",
    title: "",
    discount: "",
    couponCode: "",
    expiryDate: "",
  };

  const [form, setForm] = useState(emptyForm);

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    const unsubOffers = onSnapshot(collection(db, "offers"), (snap) => {
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubMerchants = onSnapshot(collection(db, "merchants"), (snap) => {
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubOffers();
      unsubMerchants();
    };
  }, []);

  /* ======================
     FILTER
  ====================== */
  const filtered = offers.filter((o) =>
    `${o.shopName || ""} ${o.title || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ======================
     MERCHANT SELECT
  ====================== */
  const handleMerchantSelect = (merchantId) => {
    const m = merchants.find((x) => x.id === merchantId);
    if (!m) return;

    if (!m.lat || !m.lng) {
      alert("Merchant GPS not available. Cannot create offer.");
      return;
    }

    setForm((f) => ({
      ...f,
      merchantId: m.id,
      merchantMobile: m.mobile || "",
      shopName: m.shopName || "",
      categoryName: m.categoryName || m.category || "",
    }));
  };

  /* ======================
     SAVE OFFER (FIXED)
  ====================== */
  const handleSave = async () => {
    if (!form.merchantId || !form.title) {
      alert("Merchant and Offer Title are required");
      return;
    }

    const payload = {
      merchantId: form.merchantId,

      // 🔥 SNAPSHOT DATA (THIS FIXES ADMIN TABLE)
      merchantMobile: form.merchantMobile,
      shopName: form.shopName,
      categoryName: form.categoryName,

      title: form.title,
      discount: Number(form.discount || 0),
      couponCode: form.couponCode || "",
      expiryDate: form.expiryDate || "",

      status: "active",
      updatedAt: serverTimestamp(),
      ...(editingId ? {} : { createdAt: serverTimestamp() }),
    };

    if (editingId) {
      await updateDoc(doc(db, "offers", editingId), payload);
    } else {
      await addDoc(collection(db, "offers"), payload);

      // 🔔 Notify merchant (best-effort)
      try {
        await sendNotification(
          `merchant_${form.merchantMobile}`,
          "merchant",
          "New Offer Live",
          form.title
        );
      } catch (e) {
        console.warn("Notification failed", e);
      }
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  /* ======================
     UI
  ====================== */
  return (
    <Box>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Offers</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setOpen(true);
          }}
        >
          Add Offer
        </Button>
      </Grid>

      <TextField
        fullWidth
        sx={{ mt: 2, mb: 2 }}
        label="Search by shop or title"
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
                  <TableCell>{o.shopName || "—"}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>{o.discount || 0}%</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setEditingId(o.id);
                        setForm({
                          merchantId: o.merchantId || "",
                          merchantMobile: o.merchantMobile || "",
                          shopName: o.shopName || "",
                          categoryName: o.categoryName || "",
                          title: o.title || "",
                          discount: o.discount || "",
                          couponCode: o.couponCode || "",
                          expiryDate: o.expiryDate || "",
                        });
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      onClick={() =>
                        deleteDoc(doc(db, "offers", o.id))
                      }
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

      {/* ======================
         DIALOG
      ====================== */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{editingId ? "Edit Offer" : "Add Offer"}</DialogTitle>

        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Merchant</InputLabel>
            <Select
              value={form.merchantId}
              onChange={(e) => handleMerchantSelect(e.target.value)}
              label="Merchant"
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
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Discount (%)"
            type="number"
            value={form.discount}
            onChange={(e) =>
              setForm({ ...form, discount: e.target.value })
            }
          />

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Coupon Code (optional)"
            value={form.couponCode}
            onChange={(e) =>
              setForm({ ...form, couponCode: e.target.value })
            }
          />

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Expiry Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.expiryDate}
            onChange={(e) =>
              setForm({ ...form, expiryDate: e.target.value })
            }
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
