const admin = require("firebase-admin");
const logger = require("./logger");

try {
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      logger.info("Firebase Admin SDK initialized from environment variables.");
    } catch (parseErr) {
      logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", parseErr);
    }
  } else {
    // Attempt to load from local file in dev mode
    try {
      const path = require("path");
      const fs = require("fs");
      const localKeyPath = path.join(__dirname, "../firebase-service-account.json");
      if (fs.existsSync(localKeyPath)) {
        serviceAccount = require(localKeyPath);
        logger.info("Firebase Admin SDK initialized from local firebase-service-account.json file.");
      }
    } catch (fileErr) {
      // Ignore if file doesn't exist
    }
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    logger.warn("Firebase Admin SDK was NOT initialized: FIREBASE_SERVICE_ACCOUNT env variable or local config file is missing.");
  }
} catch (error) {
  logger.error("Error initializing Firebase Admin SDK:", error);
}

module.exports = admin;
