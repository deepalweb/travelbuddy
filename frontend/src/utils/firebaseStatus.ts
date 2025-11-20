import { auth } from '../lib/firebase'
import { GoogleAuthProvider } from 'firebase/auth'

export const checkFirebaseStatus = () => {
  console.log('🔥 Firebase Authentication Status Check:')
  console.log('=====================================')
  
  // Check Firebase Auth
  console.log('✅ Firebase Auth Instance:', !!auth)
  console.log('✅ Current User:', auth?.currentUser?.email || 'Not signed in')
  
  // Check Environment Variables
  console.log('\n🔧 Environment Configuration:')
  console.log('✅ API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : '❌ Missing')
  console.log('✅ Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Missing')
  console.log('✅ Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing')
  
  // Check Google Provider
  console.log('\n🔍 Google Sign-In Provider:')
  try {
    const provider = new GoogleAuthProvider()
    console.log('✅ Google Provider:', !!provider)
    console.log('✅ Provider ID:', provider.providerId)
  } catch (error) {
    console.log('❌ Google Provider Error:', error)
  }
  
  // Check Network Connectivity
  console.log('\n🌐 Network Status:')
  console.log('✅ Online:', navigator.onLine)
  
  return {
    auth: !!auth,
    currentUser: auth?.currentUser,
    hasConfig: !!(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID),
    online: navigator.onLine
  }
}

export const testGoogleSignIn = async () => {
  if (!auth) {
    throw new Error('Firebase not initialized')
  }
  
  console.log('🔐 Testing Google Sign-In configuration...')
  
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  
  console.log('✅ Google Provider configured with scopes:', provider.getScopes())
  
  return provider
}