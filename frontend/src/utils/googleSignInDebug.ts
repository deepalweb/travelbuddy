// Google Sign-In Debug Utility
export const logGoogleSignInDebug = () => {
  console.log('=== GOOGLE SIGN-IN DEBUG ===')
  console.log('Current URL:', window.location.href)
  console.log('Firebase Config:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Present' : 'Missing',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
  })
  console.log('LocalStorage:', {
    demoToken: !!localStorage.getItem('demo_token'),
    cachedUser: !!localStorage.getItem('cached_user'),
    firebaseKeys: Object.keys(localStorage).filter(k => k.includes('firebase'))
  })
  console.log('=== END DEBUG ===')
}

export const testGoogleSignIn = async () => {
  try {
    console.log('🧪 Testing Google Sign-In configuration...')
    
    // Test 1: Firebase initialized
    const { auth } = await import('../lib/firebase')
    console.log('✅ Firebase auth:', auth ? 'Initialized' : 'Not initialized')
    
    // Test 2: Current user
    console.log('👤 Current user:', auth?.currentUser?.email || 'None')
    
    // Test 3: Backend connectivity
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
    console.log('🌐 Testing backend:', backendUrl)
    
    const response = await fetch(`${backendUrl}/api/users/test`)
    console.log('📊 Backend response:', response.status, response.ok ? 'OK' : 'Failed')
    
    if (response.ok) {
      const data = await response.json()
      console.log('📦 Backend data:', data)
    }
    
    return true
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}
