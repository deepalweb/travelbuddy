import admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    let credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    const credentialsBase64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
    
    if (!credentialsJson && !credentialsBase64) {
      console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_BASE64, FIREBASE_ADMIN_CREDENTIALS_JSON, or GOOGLE_APPLICATION_CREDENTIALS to enable auth verification.');
      return;
    }
    
    // If Base64 is provided, decode it
    if (credentialsBase64 && !credentialsJson) {
      try {
        credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf8');
      } catch (decodeError) {
        console.error('❌ Failed to decode Base64 Firebase credentials:', decodeError.message);
        console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_BASE64, FIREBASE_ADMIN_CREDENTIALS_JSON, or GOOGLE_APPLICATION_CREDENTIALS to enable auth verification.');
        return;
      }
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(credentialsJson);
    } catch (parseError) {
      console.error('❌ Failed to parse Firebase credentials JSON:', parseError.message);
      console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_JSON to enable auth verification.');
      return;
    }
    
    // Validate required fields
    if (!serviceAccount.project_id) {
      console.error('❌ Service account JSON missing project_id');
      console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_JSON to enable auth verification.');
      return;
    }
    if (!serviceAccount.private_key) {
      console.error('❌ Service account JSON missing private_key');
      console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_JSON to enable auth verification.');
      return;
    }
    if (!serviceAccount.client_email) {
      console.error('❌ Service account JSON missing client_email');
      console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_JSON to enable auth verification.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized with project:', serviceAccount.project_id);
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_JSON to enable auth verification.');
}

export default admin;