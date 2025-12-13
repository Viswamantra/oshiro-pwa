import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Grid, TextField, Button, Typography, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Table, TableBody, TableCell, TableHead, TableRow,
  TablePagination, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { db } from '../../firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot
} from 'firebase/firestore';
import { sendNotification } from '../../utils/sendNotification';

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    merchantId: '',
    merchantMobile: '',
    shopName: '',
    title: '',
    discount: '',
    couponCode: '',
    expiryDate: '',
    category: '',
    lat: null,
    lng: null
  };

  const [form, setForm] = useState(emptyForm);

  // LISTEN TO OFFERS + MERCHANTS
  useEffect(() => {
    const unsubOffers = onSnapshot(collection(db, 'offers'), snap =>
      setOffers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const unsubMer = onSnapshot(collection(db, 'merchants'), snap =>
      setMerchants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubOffers(); unsubMer(); };
  }, []);

  // FILTER OFFERS BASED ON SEARCH BAR
  const filtered = offers.filter(o => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${o.shopName} ${o.title}`.toLowerCase().includes(q);
  });

  // OPEN NEW OFFER DIALOG
  const handleOpenNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  // EDIT OFFER
  const handleEdit = (o) => {
    setEditing(o.id);
    setForm({
      merchantId: o.merchantId || '',
      merchantMobile: o.merchantMobile || '',
      shopName: o.shopName || '',
      title: o.title || '',
      discount: o.discount || '',
      couponCode: o.couponCode || '',
      expiryDate: o.expiryDate || '',
      category: o.category || '',
      lat: o.lat ?? null,
      lng: o.lng ?? null
    });
    setOpen(true);
  };

  // DELETE OFFER
  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    await deleteDoc(doc(db, 'offers', id));
  };

  // WHEN ADMIN SELECTS MERCHANT FROM DROPDOWN
  const handleMerchantSelect = (merchantId) => {
    const m = merchants.find(x => x.id === merchantId);
    if (!m) {
      setForm(emptyForm);
      return;
    }

    // Auto-fill merchant data
    setForm(f => ({
      ...f,
      merchantId,
      shopName: m.shopName || '',
      merchantMobile: m.mobile || '',
      category: m.category || '',
      lat: m.lat ?? null,
      lng: m.lng ?? null
    }));
  };

  // SAVE OFFER
  const handleSave = async () => {
    if (!form.merchantId || !form.title) {
      alert("Merchant and title required");
      return;
    }

    const payload = {
      merchantId: form.merchantId,
      merchantMobile: form.merchantMobile,
      shopName: form.shopName,
      title: form.title,
      discount: Number(form.discount || 0),
      couponCode: form.couponCode || '',
      expiryDate: form.expiryDate || '',
      category: form.category || '',
      lat: form.lat ?? null,
      lng: form.lng ?? null
    };

    if (editing) {
      await updateDoc(doc(db, 'offers', editing), payload);
    } else {
      await addDoc(collection(db, 'offers'), payload);

      // send push notification
      try {
        await sendNotification(
          `merchant_${form.merchantMobile}`,
          "merchant",
          "New Offer Created",
          `Your offer "${payload.title}" is added`
        );
      } catch (e) {
        console.log("Notification failed:", e);
      }
    }

    setOpen(false);
  };

  return (
    <Box>
      <Grid container justifyContent="space-between">
        <Typography variant="h6">Offers</Typography>
        <Button variant="contained" onClick={handleOpenNew}>Add Offer</Button>
      </Grid>

      <TextField
        label="Search by shop or offer title..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        fullWidth sx={{ mt: 2, mb: 2 }}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(o => (
                <TableRow key={o.id}>
                  <TableCell>{o.shopName}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>{o.discount}%</TableCell>
                  <TableCell>{o.expiryDate || '-'}</TableCell>
                  <TableCell>{o.category || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(o)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(o.id)}><DeleteIcon color="error" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            }

            {filtered.length === 0 &&
              <TableRow><TableCell colSpan={6} align="center">No offers found</TableCell></TableRow>
            }
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPageOptions={[10]}
        />
      </Paper>

      {/* OFFER FORM DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit Offer" : "Add Offer"}</DialogTitle>

        <DialogContent>

          {/* Select Merchant */}
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="merchant-label">Merchant</InputLabel>
            <Select
              labelId="merchant-label"
              value={form.merchantId}
              label="Merchant"
              onChange={(e) => handleMerchantSelect(e.target.value)}
            >
              <MenuItem value=""><em>Select Merchant</em></MenuItem>

              {merchants.map(m =>
                <MenuItem key={m.id} value={m.id}>
                  {m.shopName} — {m.mobile}
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <TextField label="Offer Title" fullWidth sx={{ mt: 2 }}
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

          <TextField label="Discount %" fullWidth sx={{ mt: 2 }}
            value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />

          <TextField label="Coupon Code" fullWidth sx={{ mt: 2 }}
            value={form.couponCode} onChange={e => setForm({ ...form, couponCode: e.target.value })} />

          <TextField type="date" label="Expiry Date"
            InputLabelProps={{ shrink: true }} fullWidth sx={{ mt: 2 }}
            value={form.expiryDate || ''} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />

          {/* CATEGORY — THIS WAS MISSING (BUG FIXED) */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="cat-label">Category</InputLabel>
            <Select
              labelId="cat-label"
              value={form.category}
              label="Category"
              onChange={e => setForm({ ...form, category: e.target.value })}
            >              
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Food">Food</MenuItem>
              <MenuItem value="Fashion & Clothing">Fashion & Clothing</MenuItem>
              <MenuItem value="Beauty & Spa">Beauty & Spa</MenuItem>
              <MenuItem value="Hospitals">Hospitals</MenuItem>
              <MenuItem value="Medicals">Medicals</MenuItem>              
            </Select>
          </FormControl>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
