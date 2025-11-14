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
// import { useFirebase } from '../hooks/useFirebase' // Firebase disabled
import { useConfig } from './ConfigContext'
import { apiService } from '../lib/api'

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
  // const { firebase, loading: firebaseLoading } = useFirebase() // Firebase disabled
  const firebase = null
  const firebaseLoading = false
  const { config, loading: configLoading } = useConfig()

  useEffect(() => {
    console.log('🔐 AUTH STEP 1: AuthProvider useEffect triggered', {
      firebaseLoading,
      configLoading,
      hasConfig: !!config,
      hasFirebase: !!firebase
    })
    
    if (configLoading || !config) {
      console.log('⏳ AUTH STEP 1: Waiting for dependencies')
      return
    }

    // Check for demo token first and restore demo user
    const demoToken = localStorage.getItem('demo_token')
    if (demoToken) {
      console.log('🔐 AUTH STEP 2: Demo token found, restoring demo user')
      restoreDemoUser()
      return
    }

    if (!firebase) {
      console.log('✅ AUTH STEP 2: Firebase disabled, no demo token - setting loading false')
      setIsLoading(false)
      return
    }
    
    console.log('🔐 AUTH STEP 3: Setting up Firebase auth listener')
    
    // Check for existing session
    console.log('🔐 AUTH STEP 3.1: Checking existing session', {
      currentUser: firebase.auth.currentUser,
      localStorage: {
        demoToken: !!localStorage.getItem('demo_token'),
        firebaseUser: !!localStorage.getItem('firebase:authUser:' + config.firebase.apiKey + ':[DEFAULT]')
      }
    })

    // Check for redirect result first
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebase.auth)
        if (result?.user) {
          console.log('Google Sign-In redirect successful:', result.user.email)
          await syncUserProfile(result.user)
          // Redirect to home page after successful login
          window.location.href = '/'
          return
        }
      } catch (error: any) {
        console.error('Redirect result error:', error)
      }
    }
    
    checkRedirectResult()
    
    const unsubscribe = onAuthStateChanged(firebase.auth, async (firebaseUser) => {
      console.log('🔐 AUTH STEP 4: Auth state changed', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email
      })
      
      if (firebaseUser) {
        console.log('🔐 AUTH STEP 5: User found, syncing profile')
        await syncUserProfile(firebaseUser)
      } else {
        console.log('🔐 AUTH STEP 5: No user, setting null')
        setUser(null)
      }
      setIsLoading(false)
      console.log('✅ AUTH: Loading complete')
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

      const response = await fetch(`${config?.apiBaseUrl || 'http://localhost:3001'}/api/demo-auth/verify-token`, {
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
        console.log('❌ Demo token invalid, removing')
        localStorage.removeItem('demo_token')
      }
    } catch (error) {
      console.error('Failed to restore demo user:', error)
      console.log('❌ Removing invalid demo token due to error')
      localStorage.removeItem('demo_token')
    } finally {
      setIsLoading(false)
    }
  }

  const syncUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken()
      
      // Try to sync user with backend
      const response = await fetch(`${config?.apiBaseUrl || 'http://localhost:3001'}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          firebaseUid: firebaseUser.uid
        })
      })
      
      if (response.ok) {
        const userData = await response.json()
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
        // Fallback: create basic user object
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
      console.error('Failed to sync user profile:', error)
      // Fallback: create basic user object
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
    throw new Error('Firebase authentication disabled')
    if (!firebase) throw new Error('Firebase not initialized')
    
    console.log('🔐 Starting Google Sign-In...')
    
    try {
      // Try popup first for better UX
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      console.log('🔐 Attempting popup sign-in...')
      const result = await signInWithPopup(firebase.auth, provider)
      console.log('✅ Google Sign-In popup successful:', result.user.email)
      
    } catch (popupError: any) {
      console.warn('⚠️ Popup failed, trying redirect:', popupError.message)
      
      // Fallback to redirect if popup fails
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.message.includes('popup')) {
        await loginWithGoogleRedirect()
      } else {
        throw popupError
      }
    }
  }
  
  const loginWithGoogleRedirect = async () => {
    throw new Error('Firebase authentication disabled')
    if (!firebase) throw new Error('Firebase not initialized')
    
    console.log('Starting Google Sign-In with redirect...')
    
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
      console.error('❌ Google Sign-In Redirect Error:', error)
      
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
        id: 'demo-user-' + Date.now(),
        email: 'admin@travelbuddy.com',
        username: 'Demo Admin',
        tier: 'premium',
        role: 'admin',
        isAdmin: true
      }
      
      setUser(demoUser)
      localStorage.setItem('demo_token', 'demo-token-' + Date.now())
      
      // Uncomment when backend is running:
      // const response = await fetch(`${config?.apiBaseUrl || 'http://localhost:3001'}/api/demo-auth/demo-login`, {
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
      console.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginWithGoogleRedirect, loginDemo, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}