import { useEffect, useState } from "react";

function HomeScreen() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("Location blocked", err)
    );
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>OshirO Customer Home</h2>
      
      {/* Category List */}
      <h3>Categories</h3>
      <ul>
        <li>Food</li>
        <li>Clothing</li>
        <li>Beauty & Spa</li>
        <li>Health & Hospitals</li>
        <li>Medical Shops</li>
      </ul>

      {/* Location */}
      <div>
        <h3>Your Location:</h3>
        {location ? (
          <p>Lat: {location.lat} | Lng: {location.lng}</p>
        ) : (
          <p>Fetching GPS...</p>
        )}
      </div>
      
    </div>
  );
}

export default HomeScreen;
