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
} from "firebase/firestore";
import { sendNotification } from "../../utils/sendNotification";

/* =====================================
   STEP 3 — OPENSTREETMAP GEOCODING
===================================== */
async function geocodeAddress(address) {
  if (!address) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    address
  )}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "oshiro-app/1.0" },
  });

  const data = await res.json();
  if (!data || data.length === 0) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
  };
}

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  /* =====================================
     STEP 1 — FORM STATE (WITH ADDRESS)
  ===================================== */
  const emptyForm = {
    merchantId: "",
    merchantMobile: "",
    shopName: "",
    title: "",
    discount: "",
    couponCode: "",
    expiryDate: "",
    category: "",
    address: "",
  };

  const [form, setForm] = useState(emptyForm);

  /* =====================================
     REALTIME DATA
  ===================================== */
  useEffect(() => {
    const unsubOffers = onSnapshot(collection(db, "offers"), (snap) =>
      setOffers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubMerchants = onSnapshot(collection(db, "merchants"), (snap) =>
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubOffers();
      unsubMerchants();
    };
  }, []);

  /* =====================================
     SEARCH
  ===================================== */
  const filtered = offers.filter((o) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return `${o.shopName} ${o.title}`.toLowerCase().includes(q);
  });

  const handleOpenNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const handleEdit = (o) => {
    setEditing(o.id);
    setForm({
      merchantId: o.merchantId || "",
      merchantMobile: o.merchantMobile || "",
      shopName: o.shopName || "",
      title: o.title || "",
      discount: o.discount || "",
      couponCode: o.couponCode || "",
      expiryDate: o.expiryDate || "",
      category: o.category || "",
      address: o.address || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    await deleteDoc(doc(db, "offers", id));
  };

  const handleMerchantSelect = (merchantId) => {
    const m = merchants.find((x) => x.id === merchantId);
    if (!m) return;

    setForm((f) => ({
      ...f,
      merchantId,
      merchantMobile: m.mobile || "",
      shopName: m.shopName || "",
      category: m.category || "",
      address: m.address || "",
    }));
  };

  /* =====================================
     STEP 4 — SAVE OFFER (GEOCODING)
  ===================================== */
  const handleSave = async () => {
    if (!form.merchantId || !form.title || !form.address) {
      alert("Merchant, title and address are required");
      return;
    }

    const geo = await geocodeAddress(form.address);
    if (!geo) {
      alert("Address not found. Please enter full address");
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
      address: form.address,
      lat: geo.lat,
      lng: geo.lng,
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
          "New Offer Created",
          `Your offer "${payload.title}" is live`
        );
      } catch {}
    }

    setOpen(false);
  };

  /* =====================================
     UI
  ===================================== */
  return (
    <Box>
      <Grid container justifyContent="space-between">
        <Typography variant="h6">Offers</Typography>
        <Button variant="contained" onClick={handleOpenNew}>
          Add Offer
        </Button>
      </Grid>

      <TextField
        label="Search by shop or title"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mt: 2, mb: 2 }}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Category</TableCell>
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
                  <TableCell>{o.category}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(o)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(o.id)}>
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

      {/* ADD / EDIT */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle>

        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Merchant</InputLabel>
            <Select
              value={form.merchantId}
              onChange={(e) => handleMerchantSelect(e.target.value)}
            >
              <MenuItem value="">
                <em>Select Merchant</em>
              </MenuItem>
              {merchants.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.shopName} — {m.mobile}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Offer Title"
            fullWidth
            sx={{ mt: 2 }}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <TextField
            label="Discount %"
            fullWidth
            sx={{ mt: 2 }}
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
          />

          {/* STEP 2 — ADDRESS INPUT */}
          <TextField
            label="Shop Address (Full)"
            fullWidth
            sx={{ mt: 2 }}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <MenuItem value="Food">Food</MenuItem>
              <MenuItem value="Fashion & Clothing">
                Fashion & Clothing
              </MenuItem>
              <MenuItem value="Beauty & Spa">Beauty & Spa</MenuItem>
              <MenuItem value="Hospitals">Hospitals</MenuItem>
              <MenuItem value="Medicals">Medicals</MenuItem>
            </Select>
          </FormControl>
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
