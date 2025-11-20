#!/usr/bin/env node

console.log('🔥 Firebase Configuration Checker')
console.log('==================================')

// Check environment variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

console.log('\n📋 Environment Variables:')
requiredVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: Missing`)
  }
})

// Check Google OAuth configuration
console.log('\n🔐 Google OAuth Configuration:')
console.log(`✅ Google Client ID: ${process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : '❌ Missing'}`)
console.log(`✅ Google Client Secret: ${process.env.GOOGLE_CLIENT_SECRET ? 'Set' : '❌ Missing'}`)

console.log('\n📝 Next Steps:')
console.log('1. Ensure Firebase project has Authentication enabled')
console.log('2. Enable Google Sign-in provider in Firebase Console')
console.log('3. Add authorized domains (localhost:3000, localhost:5173)')
console.log('4. Verify OAuth consent screen is configured')

console.log('\n🌐 Firebase Console: https://console.firebase.google.com/project/travelbuddy-2d1c5')