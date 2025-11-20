// Firebase Admin configuration
import admin from 'firebase-admin'

let firebaseApp = null

try {
  // Try to initialize Firebase Admin if credentials are available
  if (process.env.FIREBASE_ADMIN_CREDENTIALS_JSON && process.env.FIREBASE_ADMIN_CREDENTIALS_JSON !== 'disabled') {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS_JSON)
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    })
    
    console.log('✅ Firebase Admin initialized successfully')
  } else {
    console.log('⚠️ Firebase Admin credentials not configured - using fallback auth')
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin initialization failed:', error.message)
}

export default firebaseApp || { auth: () => null }