const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../firebase-admin-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Only POST allowed");

  const { token, title, body } = req.body || {};
  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const message = { notification: { title, body }, token };
    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, response });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
};
