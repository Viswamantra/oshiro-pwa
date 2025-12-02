const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
    })
  });
}

module.exports = async (req, res) => {
  // Only allow POST calls
  if (req.method !== "POST") {
    return res.status(200).send("Only POST allowed");
  }

  try {
    const { token, title, body } = req.body || {};

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    const message = {
      notification: {
        title: title || "OshirO Alert",
        body: body || "Test notification from OshirO backend!"
      },
      token
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, id: response });

  } catch (err) {
    console.error("Push Error:", err);
    return res.status(500).json({ error: err.message || err.toString() });
  }
};
