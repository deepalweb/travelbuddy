const admin = require('firebase-admin');

// Use existing FIREBASE_ADMIN_CREDENTIALS_JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;