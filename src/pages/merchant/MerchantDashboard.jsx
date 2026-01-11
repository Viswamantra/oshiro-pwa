import React from "react";
import { Link } from "react-router-dom";

export default function MerchantDashboard() {
  return (
    <div>
      <h2>Merchant Dashboard</h2>

      <ul>
        <li><Link to="offers">Manage Offers</Link></li>
        <li><Link to="profile">Shop Profile</Link></li>
      </ul>
    </div>
  );
}
