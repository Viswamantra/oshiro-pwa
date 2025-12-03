import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeScreen from "./pages/HomeScreen.jsx";
import MerchantDashboard from "./pages/MerchantDashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer side homepage */}
        <Route path="/" element={<HomeScreen />} />

        {/* Merchant side */}
        <Route path="/merchant" element={<MerchantDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
