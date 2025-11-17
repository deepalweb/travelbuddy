import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'travelbuddy-2d1c5.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'travelbuddy-2d1c5',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'travelbuddy-2d1c5.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '45425409967',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:45425409967:web:782638c65a40dcb156b95a'
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
