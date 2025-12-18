import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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
  fullName?: string
  phone?: string
  bio?: string
  homeCity?: string
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

    // Check for Google Sign-In redirect result BEFORE checking demo token
    if (firebase?.auth && config?.firebase?.apiKey) {
      getRedirectResult(firebase.auth)
        .then((result) => {
          if (result) {
            debug.log('✅ Google Sign-In redirect successful', result.user.email)
            // User will be synced by onAuthStateChanged
          } else {
            debug.log('ℹ️ No redirect result (normal page load)')
          }
        })
        .catch((error) => {
          debug.error('❌ Google Sign-In redirect error:', error)
          // Don't block auth flow on redirect error
        })
    }

    // Check for demo token first and restore demo user
    const demoToken = localStorage.getItem('demo_token')
    if (demoToken) {
      debug.log('🔐 AUTH STEP 2: Demo token found, restoring demo user')
      restoreDemoUser()
      return
    }

    if (!firebase?.auth || !config?.firebase?.apiKey) {
      debug.log('✅ AUTH STEP 2: Firebase disabled or not configured, no demo token - setting loading false')
      setIsLoading(false)
      return
    }
    
    debug.log('🔐 AUTH STEP 3: Setting up Firebase auth listener')
    
    // Check for existing session only if auth is available
    const currentUser = firebase.auth?.currentUser
    debug.log('🔐 AUTH STEP 3.1: Checking existing session', {
      hasAuth: !!firebase.auth,
      currentUser: currentUser,
      currentUserEmail: currentUser?.email,
      localStorage: {
        demoToken: !!localStorage.getItem('demo_token'),
        cachedUser: !!localStorage.getItem('cached_user')
      }
    })

    // If we have a cached user and Firebase has a current user, restore immediately
    if (currentUser && firebase.auth) {
      debug.log('🔐 AUTH STEP 3.2: Current user exists, syncing immediately')
      syncUserProfile(currentUser).then(() => setIsLoading(false))
    }
    
    const unsubscribe = onAuthStateChanged(firebase.auth, async (firebaseUser) => {
      debug.log('🔐 AUTH STEP 4: Auth state changed', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        hasDemoToken: !!localStorage.getItem('demo_token')
      })
      
      if (firebaseUser) {
        debug.log('🔐 AUTH STEP 5: User found, syncing profile')
        await syncUserProfile(firebaseUser)
      } else {
        // Don't clear user if demo token exists
        const demoToken = localStorage.getItem('demo_token')
        if (demoToken) {
          debug.log('🔐 AUTH STEP 5: No Firebase user but demo token exists, keeping demo user')
          // Don't clear user state
        } else {
          debug.log('🔐 AUTH STEP 5: No user, setting null')
          setUser(null)
        }
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

      const response = await fetch(`${config?.apiBaseUrl || window.location.origin}/api/demo-auth/verify-token`, {
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
      
      // Store token in localStorage for API calls
      localStorage.setItem('token', token)
      
      const syncData = {
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        firebaseUid: firebaseUser.uid
      }
      debug.log('📤 Sync data:', syncData)
      
      const apiUrl = `${config?.apiBaseUrl || window.location.origin}/api/users/sync`
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
          fullName: userData.fullName,
          phone: userData.phone,
          bio: userData.bio,
          homeCity: userData.homeCity,
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
      debug.log('🔐 Starting login for:', email)
      const userCredential = await signInWithEmailAndPassword(firebase.auth, email, password)
      debug.log('✅ Login successful, waiting for auth state change')
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      debug.error('❌ Login failed:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const loginWithGoogle = async () => {
    if (!firebase) throw new Error('Firebase not initialized')
    try {
      debug.log('🔐 Starting Google Sign-In')
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      // Use redirect instead of popup for Azure compatibility
      await signInWithRedirect(firebase.auth, provider)
      // User will be redirected to Google, then back to app
      // Result handled by getRedirectResult in useEffect
    } catch (error: any) {
      debug.error('❌ Google Sign-In failed:', error)
      throw new Error(error.message || 'Google Sign-In failed')
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
      // For demo users, just update local state
      const demoToken = localStorage.getItem('demo_token')
      if (demoToken) {
        setUser(prev => prev ? { ...prev, ...data } : null)
        return
      }
      
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
        setUser(prev => prev ? { ...prev, ...userData, ...data } : null)
        // Update cached user
        const updatedUser = { ...user, ...userData, ...data }
        localStorage.setItem('cached_user', JSON.stringify(updatedUser))
      } else {
        throw new Error('Profile update failed')
      }
    } catch (error) {
      throw new Error('Profile update failed')
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
      localStorage.removeItem('token')
      if (firebase) {
        await signOut(firebase.auth)
      }
      setUser(null)
    } catch (error) {
      debug.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginDemo, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
