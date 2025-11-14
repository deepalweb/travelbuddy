import { auth } from '../lib/firebase'
import { GoogleAuthProvider } from 'firebase/auth'

export const testFirebaseConfig = () => {
  console.log('🔥 Firebase Config Test:')
  console.log('Auth instance:', !!auth)
  console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing')
  console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
  console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
  
  // Test Google provider
  try {
    const provider = new GoogleAuthProvider()
    console.log('Google Provider:', !!provider)
  } catch (error) {
    console.error('Google Provider Error:', error)
  }
}