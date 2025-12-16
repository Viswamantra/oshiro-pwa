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

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { db } from "../../firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
} from "firebase/firestore";
import { sendNotification } from "../../utils/sendNotification";

/* ---------- OSM GEOCODING ---------- */
async function geocodeAddress(address) {
  if (!address) return null;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
    {
      headers: {
        "User-Agent": "oshiro-pwa/1.0",
        "Accept-Language": "en",
      },
    }
  );
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: +data[0].lat, lng: +data[0].lon };
}

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewLoc, setPreviewLoc] = useState(null);

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
    radius: 1000,
  };

  const [form, setForm] = useState(emptyForm);

  /* ---------- DATA ---------- */
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "offers"), s =>
      setOffers(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "merchants"), s =>
      setMerchants(s.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); };
  }, []);

  const filtered = offers.filter(o =>
    `${o.shopName} ${o.title}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleMerchantSelect = (id) => {
    const m = merchants.find(x => x.id === id);
    if (!m) return;
    setForm(f => ({
      ...f,
      merchantId: id,
      merchantMobile: m.mobile || "",
      shopName: m.shopName || "",
      category: m.category || "",
      address: m.address || "",
    }));
  };

  const handleSave = async () => {
    if (!form.merchantId || !form.title || !form.address) {
      alert("Merchant, title & address required");
      return;
    }

    const geo = await geocodeAddress(form.address);
    if (!geo) {
      alert("Address not found. Please add full address.");
      return;
    }

    const payload = {
      ...form,
      discount: Number(form.discount || 0),
      radius: Number(form.radius || 1000),
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
          "New Offer Live",
          payload.title
        );
      } catch {}
    }
    setOpen(false);
  };

  return (
    <Box>
      <Grid container justifyContent="space-between">
        <Typography variant="h6">Offers</Typography>
        <Button variant="contained" onClick={() => { setForm(emptyForm); setOpen(true); }}>
          Add Offer
        </Button>
      </Grid>

      <TextField fullWidth sx={{ mt: 2, mb: 2 }}
        label="Search"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Radius (m)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page*rowsPerPage, page*rowsPerPage+rowsPerPage)
              .map(o => (
                <TableRow key={o.id}>
                  <TableCell>{o.shopName}</TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>{o.radius}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => {
                      setEditing(o.id);
                      setForm(o);
                      setPreviewLoc({ lat: o.lat, lng: o.lng });
                      setOpen(true);
                    }}><EditIcon /></IconButton>
                    <IconButton onClick={() => deleteDoc(doc(db,"offers",o.id))}>
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
          onPageChange={(e,p)=>setPage(p)}
          rowsPerPageOptions={[10]}
        />
      </Paper>

      {/* ---------- DIALOG ---------- */}
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth>
        <DialogTitle>{editing?"Edit Offer":"Add Offer"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt:1 }}>
            <InputLabel>Merchant</InputLabel>
            <Select value={form.merchantId}
              onChange={e=>handleMerchantSelect(e.target.value)}>
              {merchants.map(m=>(
                <MenuItem key={m.id} value={m.id}>{m.shopName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField fullWidth sx={{ mt:2 }} label="Offer Title"
            value={form.title}
            onChange={e=>setForm({...form,title:e.target.value})}
          />

          <TextField fullWidth sx={{ mt:2 }} label="Radius (meters)"
            type="number"
            value={form.radius}
            onChange={e=>setForm({...form,radius:+e.target.value})}
          />

          <TextField fullWidth sx={{ mt:2 }} label="Full Address"
            value={form.address}
            onChange={e=>setForm({...form,address:e.target.value})}
          />

          {previewLoc && (
            <Box sx={{ mt:2, height:200 }}>
              <MapContainer center={[previewLoc.lat,previewLoc.lng]} zoom={15}
                style={{ height:"100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <Marker position={[previewLoc.lat,previewLoc.lng]} />
              </MapContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
