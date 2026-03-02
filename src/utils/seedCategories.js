import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const categories = [
  "Medicals",
  "Other Services",
  "Education",
  "Hospitals",
  "Beauty & Spa",
  "Food",
  "Fashion & Clothing",
];

export async function seedCategoriesOnce() {
  const snap = await getDocs(collection(db, "categories"));

  if (!snap.empty) {
    console.log("Categories already exist. Skipping seed.");
    return;
  }

  for (const name of categories) {
    await addDoc(collection(db, "categories"), {
      name,
      active: true,
      createdAt: new Date(),
    });
  }

  console.log("Categories seeded successfully.");
}