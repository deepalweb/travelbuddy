import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  type User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useConfig } from './ConfigContext'
import { apiService } from '../lib/api'
import { debug } from '../utils/debug'

interface User {
  id: string
  email: string
  username: string
  tier?: string
  profilePicture?: string
  firebaseUid?: string
  role?: string
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithGoogleRedirect: () => Promise<void>
  loginDemo: () => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const firebase = { auth }
  const firebaseLoading = false
  const { config, loading: configLoading } = useConfig()

  useEffect(() => {
    debug.log('🔐 AUTH STEP 1: AuthProvider useEffect triggered', {
      firebaseLoading,
      configLoading,
      hasConfig: !!config,
      hasFirebase: !!firebase
    })
    
    if (configLoading || !config) {
      debug.log('⏳ AUTH STEP 1: Waiting for dependencies')
      return
    }

    // Check for demo token first and restore demo user
    const demoToken = localStorage.getItem('demo_token')
    if (demoToken) {
      debug.log('🔐 AUTH STEP 2: Demo token found, restoring demo user')
      restoreDemoUser()
      return
    }

    if (!firebase || !config?.firebase?.apiKey) {
      debug.log('✅ AUTH STEP 2: Firebase disabled or not configured, no demo token - setting loading false')
      setIsLoading(false)
      return
    }
    
    debug.log('🔐 AUTH STEP 3: Setting up Firebase auth listener')
    
    // Check for existing session
    debug.log('🔐 AUTH STEP 3.1: Checking existing session', {
      currentUser: firebase.auth.currentUser,
      localStorage: {
        demoToken: !!localStorage.getItem('demo_token'),
        firebaseUser: !!localStorage.getItem('firebase:authUser:' + config.firebase.apiKey + ':[DEFAULT]')
      }
    })

    // Check for redirect result
    const checkRedirectResult = async () => {
      console.log('🔍🔍🔍 REDIRECT CHECK STARTED')
      console.log('Current URL:', window.location.href)
      console.log('URL params:', window.location.search)
      
      try {
        debug.log('🔍 Checking for redirect result...')
        console.log('Calling getRedirectResult...')
        
        const result = await getRedirectResult(firebase.auth)
        
        console.log('getRedirectResult returned:', result)
        console.log('Has user?', !!result?.user)
        
        if (result?.user) {
          debug.log('✅ Redirect successful!')
          debug.log('📧 User email:', result.user.email)
          debug.log('👤 User ID:', result.user.uid)
          
          const userObj = {
            id: result.user.uid,
            email: result.user.email || '',
            username: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            tier: 'free',
            firebaseUid: result.user.uid,
            role: 'regular',
            isAdmin: false
          }
          
          console.log('👤 Setting user from redirect result:', userObj)
          setUser(userObj)
          localStorage.setItem('cached_user', JSON.stringify(userObj))
          console.log('✅ User state set, localStorage updated')
          
          // Background sync
          syncUserProfile(result.user).catch(err => {
            debug.error('Background sync failed:', err)
          })
        } else {
          console.log('ℹ️ No redirect result - result was:', result)
          debug.log('ℹ️ No redirect result found (this is normal on first load)')
        }
      } catch (error: any) {
        console.error('❌❌❌ REDIRECT CHECK ERROR:', error)
        debug.error('❌ Redirect result error:', error)
        console.error('Full redirect error details:', {
          code: error.code,
          message: error.message,
          url: window.location.href,
          details: error
        })
        
        // Show user-friendly error
        if (error.code === 'auth/unauthorized-domain') {
          alert(
            'Authorization Error: Your domain is not authorized.\n\n' +
            `Add "${window.location.hostname}" to Firebase Console → Authentication → Settings → Authorized domains`
          )
        } else if (error.code) {
          alert(`Authentication Error: ${error.message}\n\nCode: ${error.code}`)
        }
      }
      
      console.log('🔍🔍🔍 REDIRECT CHECK COMPLETED')
    }
    
    checkRedirectResult()
    
    const unsubscribe = onAuthStateChanged(firebase.auth, async (firebaseUser) => {
      debug.log('🔐 AUTH STEP 4: Auth state changed', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email
      })
      
      if (firebaseUser) {
        debug.log('🔐 AUTH STEP 5: User found, syncing profile')
        await syncUserProfile(firebaseUser)
      } else {
        debug.log('🔐 AUTH STEP 5: No user, setting null')
        console.log('⚠️ onAuthStateChanged: Clearing user state')
        setUser(null)
      }
      setIsLoading(false)
      debug.log('✅ AUTH: Loading complete')
    })

    return () => unsubscribe()
  }, [firebase, config, firebaseLoading, configLoading])

  const restoreDemoUser = async () => {
    try {
      const demoToken = localStorage.getItem('demo_token')
      if (!demoToken) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`${config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'}/api/demo-auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${demoToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          tier: data.user.tier,
          role: data.user.role,
          isAdmin: data.user.isAdmin
        })
      } else {
        debug.log('❌ Demo token invalid, removing')
        localStorage.removeItem('demo_token')
      }
    } catch (error) {
      debug.error('Failed to restore demo user:', error)
      debug.log('❌ Removing invalid demo token due to error')
      localStorage.removeItem('demo_token')
    } finally {
      setIsLoading(false)
    }
  }

  const syncUserProfile = async (firebaseUser: FirebaseUser) => {
    // Global deduplication to prevent multiple sync requests
    const cacheKey = `sync_${firebaseUser.uid}`
    if ((window as any)[cacheKey]) {
      debug.log('⏭️ Skipping duplicate sync request')
      // Still set user from cache if available
      const cachedUser = localStorage.getItem('cached_user')
      if (cachedUser && !user) {
        try {
          setUser(JSON.parse(cachedUser))
        } catch (e) {
          debug.error('Failed to parse cached user')
        }
      }
      return
    }
    (window as any)[cacheKey] = true
    
    // Clear cache after 5 seconds
    setTimeout(() => {
      delete (window as any)[cacheKey]
    }, 5000)

    try {
      debug.log('🔄 Starting user sync for:', firebaseUser.uid)
      debug.log('📧 User email:', firebaseUser.email)
      
      const token = await firebaseUser.getIdToken()
      debug.log('🔑 Firebase token obtained:', token ? 'Yes' : 'No')
      
      const syncData = {
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        firebaseUid: firebaseUser.uid
      }
      debug.log('📤 Sync data:', syncData)
      
      const apiUrl = `${config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'}/api/users/sync`
      debug.log('🌐 API URL:', apiUrl)
      
      // Try to sync user with backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(syncData)
      })
      
      debug.log('📊 Response status:', response.status)
      debug.log('📊 Response ok:', response.ok)
      
      if (response.ok) {
        const userData = await response.json()
        debug.log('✅ Sync successful:', userData)
        const userObj = {
          id: userData._id,
          email: userData.email,
          username: userData.username,
          tier: userData.tier || 'free',
          profilePicture: userData.profilePicture,
          firebaseUid: firebaseUser.uid,
          role: userData.role || 'regular',
          isAdmin: userData.isAdmin || false
        }
        setUser(userObj)
        // Cache user for quick restore
        localStorage.setItem('cached_user', JSON.stringify(userObj))
      } else {
        const errorText = await response.text()
        debug.error('❌ Sync failed:', response.status, errorText)
        debug.log('⚠️ Using fallback - user will still be authenticated')
        // IMPORTANT: Still set user to allow login even if backend sync fails
        const fallbackUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          tier: 'free',
          firebaseUid: firebaseUser.uid,
          role: 'regular',
          isAdmin: false
        }
        setUser(fallbackUser)
        localStorage.setItem('cached_user', JSON.stringify(fallbackUser))
      }
    } catch (error) {
      debug.error('💥 User sync error:', error)
      debug.log('⚠️ Using fallback user object due to error')
      // Fallback: create basic user object - don't block auth flow
      const fallbackUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        tier: 'free',
        firebaseUid: firebaseUser.uid,
        role: 'regular',
        isAdmin: false
      }
      setUser(fallbackUser)
      localStorage.setItem('cached_user', JSON.stringify(fallbackUser))
    }
  }

  const login = async (email: string, password: string) => {
    if (!firebase) throw new Error('Firebase not initialized')
    try {
      const userCredential = await signInWithEmailAndPassword(firebase.auth, email, password)
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const register = async (username: string, email: string, password: string) => {
    if (!firebase) throw new Error('Firebase not initialized')
    try {
      const userCredential = await createUserWithEmailAndPassword(firebase.auth, email, password)
      // User state will be updated by onAuthStateChanged with username
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!firebase?.auth.currentUser) throw new Error('Not authenticated')
      
      const token = await firebase.auth.currentUser.getIdToken()
      const response = await fetch(`${config?.apiBaseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(prev => prev ? { 
          ...prev, 
          username: userData.username || data.username,
          email: userData.email || data.email 
        } : null)
      } else {
        throw new Error('Profile update failed')
      }
    } catch (error) {
      throw new Error('Profile update failed')
    }
  }

  const loginWithGoogle = async () => {
    if (!firebase) throw new Error('Firebase not initialized')
    
    // Always use redirect in production (Azure)
    const isProduction = window.location.hostname !== 'localhost'
    
    if (isProduction) {
      debug.log('🔐 Production: Using redirect method for Azure')
      return await loginWithGoogleRedirect()
    }
    
    debug.log('🔐 Localhost: Using popup method')
    
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(firebase.auth, provider)
      const firebaseUser = result.user
      
      debug.log('✅ Popup successful:', firebaseUser.email)
      
      const userObj = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        tier: 'free',
        firebaseUid: firebaseUser.uid,
        role: 'regular',
        isAdmin: false
      }
      
      setUser(userObj)
      localStorage.setItem('cached_user', JSON.stringify(userObj))
      
      // Background sync
      syncUserProfile(firebaseUser).catch(err => {
        debug.error('Background sync failed:', err)
      })
      
    } catch (error: any) {
      debug.error('❌ Google Sign-In Error:', error)
      console.error('Full error details:', {
        code: error.code,
        message: error.message,
        details: error
      })
      
      // More specific error messages
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked. Please allow popups for this site.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled.')
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domain not authorized in Firebase Console. Add your Azure domain to authorized domains.')
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign-In not enabled in Firebase Console.')
      }
      
      throw new Error(error.message || 'Google sign-in failed')
    }
  }
  
  const loginWithGoogleRedirect = async () => {
    if (!firebase) throw new Error('Firebase not initialized')
    
    debug.log('🔐 Starting Google Sign-In with redirect...')
    debug.log('🌐 Current URL:', window.location.href)
    
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      debug.log('🚀 Initiating redirect...')
      await signInWithRedirect(firebase.auth, provider)
      
    } catch (error: any) {
      debug.error('❌ Google Sign-In Redirect Error:', error)
      console.error('Full redirect error:', {
        code: error.code,
        message: error.message,
        hostname: window.location.hostname,
        details: error
      })
      
      // Specific error handling for Azure
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error(
          `Domain "${window.location.hostname}" not authorized. ` +
          'Go to Firebase Console → Authentication → Settings → Authorized domains and add: ' +
          window.location.hostname
        )
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Google Sign-In not enabled. ' +
          'Go to Firebase Console → Authentication → Sign-in method and enable Google.'
        )
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error(
          'Network error. Check your internet connection and Firebase configuration.'
        )
      }
      
      throw new Error(error.message || 'Google sign-in failed')
    }
  }

  const loginDemo = async () => {
    try {
      // Mock demo login without backend
      const demoUser = {
        id: 'demo-user-123',
        email: 'admin@travelbuddy.com',
        username: 'Demo Admin',
        tier: 'premium',
        role: 'admin',
        isAdmin: true
      }
      
      setUser(demoUser)
      localStorage.setItem('demo_token', 'demo-token-123')
      
      // Uncomment when backend is running:
      // const response = await fetch(`${config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'}/api/demo-auth/demo-login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: 'admin@travelbuddy.com', password: 'demo' })
      // })
      // if (response.ok) {
      //   const data = await response.json()
      //   setUser(data.user)
      //   localStorage.setItem('demo_token', data.token)
      // }
    } catch (error: any) {
      throw new Error(error.message || 'Demo login failed')
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('demo_token')
      localStorage.removeItem('cached_user')
      if (firebase) {
        await signOut(firebase.auth)
      }
      setUser(null)
    } catch (error) {
      debug.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginWithGoogleRedirect, loginDemo, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
