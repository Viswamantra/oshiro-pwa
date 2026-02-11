const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.sendPushNotification = functions.https.onCall(
  async (data) => {
    try {
      const { tokens, title, body, dataPayload } = data;

      if (!tokens || tokens.length === 0) return;

      const message = {
        notification: { title, body },
        data: dataPayload || {},
        tokens,
      };

      const response =
        await admin.messaging().sendMulticast(message);

      return response;
    } catch (error) {
      console.error(error);
      throw new functions.https.HttpsError(
        "internal",
        error.message
      );
    }
  }
);
