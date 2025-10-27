import admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      console.log('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_JSON to enable auth verification.');
      return;
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