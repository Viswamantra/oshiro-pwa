import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App.jsx';
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then(() => console.log("Firebase SW registered"))
    .catch((err) => console.error("SW error:", err));
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
