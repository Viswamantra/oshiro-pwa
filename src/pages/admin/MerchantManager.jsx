/**
 * 🔒 LOCKED AFTER PHASE 2.6
 * Admin merchant orchestration logic
 */

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";

export default function MerchantManager() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    shopName: "",
    mobile: "",
    doorNo: "",
    street: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    addressCombined: "",
    lat: null,
    lng: null,
    category: "", 
    status: "",
  });

  /* =========================
     LOAD MERCHANTS
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "merchants"), (snap) =>
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  /* =========================
     LOAD ACTIVE CATEGORIES
  ========================= */
  useEffect(() => {
    const q = query(
      collection(db, "categories"),
      where("status", "==", "active")
    );

    const unsub = onSnapshot(q, (snap) => {
      setCategories(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
        }))
      );
    });

    return () => unsub();
  }, []);

  function startEdit(m) {
    setEditing(m.id);
    setForm({
      shopName: m.shopName || "",
      mobile: m.mobile || "",
      doorNo: m.doorNo || "",
      street: m.street || "",
      area: m.area || "",
      city: m.city || "",
      state: m.state || "",
      pincode: m.pincode || "",
      addressCombined: m.addressCombined || "",
      lat: m.lat ?? null,
      lng: m.lng ?? null,
      category: m.category || "",
      status: m.status || "",
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await updateDoc(doc(db, "merchants", editing), {
        shopName: form.shopName,
        doorNo: form.doorNo,
        street: form.street,
        area: form.area,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        addressCombined: form.addressCombined,
        lat: form.lat ?? null,
        lng: form.lng ?? null,
        category: form.category,
        status: form.status,
      });
      setEditing(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function removeMerchant(id) {
    if (!window.confirm("Delete merchant?")) return;
    try {
      await deleteDoc(doc(db, "merchants", id));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Merchants
      </Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {list.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.shopName}</TableCell>
                <TableCell>{m.mobile}</TableCell>
                <TableCell>{m.city}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => startEdit(m)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => removeMerchant(m.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* EDIT DIALOG */}
      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Merchant</DialogTitle>
        <DialogContent>
          <TextField
            label="Shop Name"
            fullWidth
            sx={{ mt: 1 }}
            value={form.shopName}
            onChange={(e) =>
              setForm({ ...form, shopName: e.target.value })
            }
          />

          <TextField
            label="Mobile"
            fullWidth
            sx={{ mt: 1 }}
            value={form.mobile}
            disabled
          />

          <TextField
            label="City"
            fullWidth
            sx={{ mt: 1 }}
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />

          {/* 🔥 DYNAMIC CATEGORY DROPDOWN */}
          <TextField
            select
            label="Category"
            fullWidth
            sx={{ mt: 1 }}
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.name}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Status"
            fullWidth
            sx={{ mt: 1 }}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />

          <TextField
            label="Address (combined)"
            fullWidth
            sx={{ mt: 1 }}
            value={form.addressCombined}
            onChange={(e) =>
              setForm({ ...form, addressCombined: e.target.value })
            }
          />

          <TextField
            label="Latitude"
            fullWidth
            sx={{ mt: 1 }}
            value={form.lat ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                lat: e.target.value ? Number(e.target.value) : null,
              })
            }
          />

          <TextField
            label="Longitude"
            fullWidth
            sx={{ mt: 1 }}
            value={form.lng ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                lng: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
