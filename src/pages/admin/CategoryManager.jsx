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
========================= */
export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  const [msg, setMsg] = useState("");

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), async (snap) => {
      const list = [];

      for (const d of snap.docs) {
        // count merchants per category
        const mq = query(
          collection(db, "merchants"),
          where("category", "==", d.data().name)
        );
        const merchantSnap = await getDocs(mq);

        list.push({
          id: d.id,
          ...d.data(),
          merchantCount: merchantSnap.size,
        });
      }

      setCategories(list);
    });

    return () => unsub();
  }, []);

  /* =========================
     SUBMIT (ADD / UPDATE)
  ========================= */
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setMsg("Category name required");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "categories", editingId), {
          ...form,
          updatedAt: serverTimestamp(),
        });
        setMsg("Category updated");
      } else {
        await addDoc(collection(db, "categories"), {
          ...form,
          createdAt: serverTimestamp(),
        });
        setMsg("Category added");
      }

      setForm({ name: "", description: "", status: "active" });
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setMsg("Operation failed");
    }
  }

  /* =========================
     EDIT
  ========================= */
  function handleEdit(cat) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || "",
      status: cat.status,
    });
  }

  /* =========================
     DELETE (HARD)
     👉 you can change to soft delete if needed
  ========================= */
  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    await deleteDoc(doc(db, "categories", id));
  }

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
              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={2}>
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
                Merchants: {cat.merchantCount}
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
