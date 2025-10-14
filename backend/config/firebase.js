import admin from 'firebase-admin';

try {
  if (!admin.apps.length) {
    const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      throw new Error('FIREBASE_ADMIN_CREDENTIALS_JSON environment variable not set');
    }

    const serviceAccount = JSON.parse(credentialsJson);
    
    // Validate required fields
    if (!serviceAccount.project_id) {
      throw new Error('Service account JSON missing project_id');
    }
    if (!serviceAccount.private_key) {
      throw new Error('Service account JSON missing private_key');
    }
    if (!serviceAccount.client_email) {
      throw new Error('Service account JSON missing client_email');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized with project:', serviceAccount.project_id);
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  throw error;
}

export default admin;