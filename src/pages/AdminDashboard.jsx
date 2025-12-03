import { useEffect, useState } from "react";

function AdminDashboard() {
  const [customers, setCustomers] = useState([]);
  const [merchants, setMerchants] = useState([]);

  useEffect(() => {
    // Simulated data
    setCustomers([
      { mobile: "8888888888", lastVisit: "02-Dec" },
      { mobile: "7777777777", lastVisit: "01-Dec" },
    ]);

    setMerchants([
      { mobile: "9876543210", shop: "Meghana Textiles" },
      { mobile: "9123456789", shop: "Sai Tiffins Center" },
    ]);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin Dashboard</h2>

      <h3>Customer Records</h3>
      {customers.map((c, i) => (
        <div key={i} style={{ borderBottom: "1px solid #ccc" }}>
          Mobile: {c.mobile} <br />
          Last Visit: {c.lastVisit}
        </div>
      ))}

      <hr />

      <h3>Merchant Records</h3>
      {merchants.map((m, i) => (
        <div key={i} style={{ borderBottom: "1px solid #ccc" }}>
          Merchant Mobile: {m.mobile} <br />
          Shop Name: {m.shop}
        </div>
      ))}
    </div>
  );
}

export default AdminDashboard;
