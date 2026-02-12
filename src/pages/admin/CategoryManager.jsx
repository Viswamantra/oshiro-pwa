import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  IconButton,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase";

/* =========================
   ADMIN CATEGORY MANAGER
   ✔ Icon Support
   ✔ Sort Order Support
   ✔ Backward Compatible
========================= */

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    icon: "category",
    sortOrder: 999,
  });

  const [msg, setMsg] = useState("");

  /* =========================
     LOAD CATEGORIES LIVE
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), async (snap) => {
      const list = [];

      for (const d of snap.docs) {
        const data = d.data();

        // Merchant count (Backward compatible using category NAME)
        const mq = query(
          collection(db, "merchants"),
          where("category", "==", data.name)
        );

        const merchantSnap = await getDocs(mq);

        list.push({
          id: d.id,
          name: data.name || "",
          description: data.description || "",
          status: data.status || "active",
          icon: data.icon || "category",
          sortOrder: data.sortOrder || 999,
          merchantCount: merchantSnap.size,
          ...data,
        });
      }

      // Sort by sortOrder
      list.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

      setCategories(list);
    });

    return () => unsub();
  }, []);

  /* =========================
     ADD / UPDATE CATEGORY
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setMsg("Category name required");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || "",
        status: form.status || "active",
        icon: form.icon || "category",
        sortOrder: Number(form.sortOrder) || 999,
      };

      if (editingId) {
        await updateDoc(doc(db, "categories", editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        setMsg("Category updated successfully");
      } else {
        await addDoc(collection(db, "categories"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMsg("Category added successfully");
      }

      // Reset form
      setForm({
        name: "",
        description: "",
        status: "active",
        icon: "category",
        sortOrder: 999,
      });

      setEditingId(null);
    } catch (err) {
      console.error(err);
      setMsg("Operation failed");
    }
  }

  /* =========================
     EDIT CATEGORY
  ========================= */
  function handleEdit(cat) {
    setEditingId(cat.id);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
      status: cat.status || "active",
      icon: cat.icon || "category",
      sortOrder: cat.sortOrder || 999,
    });
  }

  /* =========================
     DELETE CATEGORY
  ========================= */
  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
  }

  /* =========================
     UI
  ========================= */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Admin – Category Management
      </Typography>

      {/* ADD / EDIT FORM */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            {editingId ? "Edit Category" : "Add New Category"}
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Category Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  label="Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  label="Material Icon Name"
                  value={form.icon}
                  onChange={(e) =>
                    setForm({ ...form, icon: e.target.value })
                  }
                  helperText="Example: restaurant, spa, shopping_bag"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  label="Sort Order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: Number(e.target.value),
                    })
                  }
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={1.5}>
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  fullWidth
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={0.5}>
                <Button type="submit" variant="contained" fullWidth>
                  {editingId ? "Update" : "Add"}
                </Button>
              </Grid>

              {msg && (
                <Grid item xs={12}>
                  <Typography color="primary">{msg}</Typography>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>

      {/* CATEGORY LIST */}
      <Typography variant="h6" gutterBottom>
        All Categories
      </Typography>

      {categories.map((cat) => (
        <Card key={cat.id} sx={{ mb: 1 }}>
          <CardContent
            sx={{ display: "flex", justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="subtitle1">
                {cat.name} ({cat.status})
              </Typography>

              <Typography variant="body2">
                {cat.description || "No description"}
              </Typography>

              <Typography variant="caption">
                Merchants: {cat.merchantCount} | Icon: {cat.icon} | Order:{" "}
                {cat.sortOrder}
              </Typography>
            </Box>

            <Box>
              <IconButton onClick={() => handleEdit(cat)}>
                <EditIcon />
              </IconButton>

              <IconButton onClick={() => handleDelete(cat.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
