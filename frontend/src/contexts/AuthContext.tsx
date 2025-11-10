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
import { useFirebase } from '../hooks/useFirebase'
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
  const { firebase, loading: firebaseLoading } = useFirebase()
  const { config, loading: configLoading } = useConfig()

  useEffect(() => {
    if (firebaseLoading || configLoading || !config) {
      return
    }

    // Check for demo token first and restore demo user
    const demoToken = localStorage.getItem('demo_token')
    if (demoToken) {
      restoreDemoUser()
      return
    }

    if (!firebase) {
      setIsLoading(false)
      return
    }

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
      if (firebaseUser) {
        await syncUserProfile(firebaseUser)
      } else {
        setUser(null)
      }
      setIsLoading(false)
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
        localStorage.removeItem('demo_token')
      }
    } catch (error) {
      console.error('Failed to restore demo user:', error)
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
    if (!firebase) throw new Error('Firebase not initialized')
    
    console.log('Starting Google Sign-In with redirect method...')
    
    // Always use redirect method to avoid popup issues
    await loginWithGoogleRedirect()
  }
  
  const loginWithGoogleRedirect = async () => {
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
      console.error('Google Sign-In Redirect Error:', error)
      throw new Error(error.message || 'Google sign-in redirect failed')
    }
  }

  const loginDemo = async () => {
    try {
      const response = await fetch(`${config?.apiBaseUrl || 'http://localhost:3001'}/api/demo-auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@travelbuddy.com', password: 'demo' })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Demo login response:', data) // Debug log
        setUser({
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          tier: data.user.tier,
          role: data.user.role,
          isAdmin: data.user.isAdmin
        })
        localStorage.setItem('demo_token', data.token)
      } else {
        throw new Error('Demo login failed')
      }
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