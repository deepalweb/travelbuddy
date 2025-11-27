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
      try {
        const result = await getRedirectResult(firebase.auth)
        if (result?.user) {
          debug.log('Google Sign-In redirect successful:', result.user.email)
          await syncUserProfile(result.user)
          return
        }
      } catch (error: any) {
        debug.error('Redirect result error:', error)
      }
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
        setUser({
          id: userData._id,
          email: userData.email,
          username: userData.username,
          tier: userData.tier || 'free',
          profilePicture: userData.profilePicture,
          firebaseUid: firebaseUser.uid,
          role: userData.role || 'regular',
          isAdmin: userData.isAdmin || false
        })
      } else {
        const errorText = await response.text()
        debug.error('❌ Sync failed:', response.status, errorText)
        debug.log('⚠️ Using fallback - user will still be authenticated')
        // IMPORTANT: Still set user to allow login even if backend sync fails
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          tier: 'free',
          firebaseUid: firebaseUser.uid,
          role: 'regular',
          isAdmin: false
        })
      }
    } catch (error) {
      debug.error('💥 User sync error:', error)
      debug.log('⚠️ Using fallback user object due to error')
      // Fallback: create basic user object - don't block auth flow
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        tier: 'free',
        firebaseUid: firebaseUser.uid,
        role: 'regular',
        isAdmin: false
      })
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
    
    debug.log('🔐 Starting Google Sign-In...')
    
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      debug.log('🔐 Attempting popup sign-in...')
      const result = await signInWithPopup(firebase.auth, provider)
      debug.log('✅ Google Sign-In successful:', result.user.email)
      
      return result
      
    } catch (error: any) {
      debug.error('❌ Google Sign-In Error:', error)
      
      // Try redirect if popup fails
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        debug.log('🔄 Popup failed, trying redirect...')
        await loginWithGoogleRedirect()
        return
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domain not authorized for Google Sign-in')
      } else {
        throw new Error(error.message || 'Google sign-in failed')
      }
    }
  }
  
  const loginWithGoogleRedirect = async () => {
    if (!firebase) throw new Error('Firebase not initialized')
    
    debug.log('Starting Google Sign-In with redirect...')
    
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      await signInWithRedirect(firebase.auth, provider)
      // The page will redirect, so no need to handle result here
    } catch (error: any) {
      debug.error('❌ Google Sign-In Redirect Error:', error)
      
      // Provide helpful error messages
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domain not authorized. Add localhost:3000 to Firebase authorized domains.')
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google Sign-In not enabled in Firebase console.')
      } else {
        throw new Error(error.message || 'Google sign-in failed')
      }
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
