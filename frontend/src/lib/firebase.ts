import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

let app: any = null
let auth: any = null

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined') {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    console.log('✅ Firebase initialized successfully')
  } else {
    console.log('⚠️ Firebase config missing, running without Firebase')
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
}

export { auth }
export default app
