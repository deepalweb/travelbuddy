import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

const getEnv = (key: string) => {
  const runtimeValue = (window as any).ENV?.[key]
  const buildValue = import.meta.env[key]
  
  // If runtime value is still a token placeholder, use build value
  if (runtimeValue && !runtimeValue.startsWith('#{')) {
    return runtimeValue
  }
  return buildValue
}

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
}

let app: any = null
let auth: any = null

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined') {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    // Set persistence to LOCAL to keep user logged in
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('⚠️ Failed to set auth persistence:', error)
    })
    console.log('✅ Firebase initialized successfully with LOCAL persistence')
  } else {
    console.log('⚠️ Firebase config missing, running without Firebase')
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error)
}

export { auth }
export default app
