import React, { createContext, useContext, useEffect } from 'react'
import { useConfig } from './ConfigContext'
import { useFirebaseAuth } from '../hooks/useFirebaseAuth'
import { useUserSync } from '../hooks/useUserSync'
import { useDemoAuth } from '../hooks/useDemoAuth'

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
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config, loading: configLoading } = useConfig()
  const { firebaseUser, loading: firebaseLoading, loginWithEmail, registerWithEmail, loginWithGoogle: googleLogin, logout: firebaseLogout } = useFirebaseAuth()
  const { user, setUser, syncUser, clearUser } = useUserSync(config?.apiBaseUrl)
  const { demoUser, loginDemo: demoLogin, logoutDemo } = useDemoAuth(config?.apiBaseUrl)

  const isLoading = configLoading || firebaseLoading

  // Sync Firebase user with backend
  useEffect(() => {
    if (firebaseUser && !demoUser) {
      syncUser(firebaseUser)
    } else if (!firebaseUser && !demoUser) {
      clearUser()
    }
  }, [firebaseUser, demoUser, syncUser, clearUser])

  // Set demo user when available
  useEffect(() => {
    if (demoUser) {
      setUser(demoUser as User)
    }
  }, [demoUser, setUser])

  const login = async (email: string, password: string) => {
    await loginWithEmail(email, password)
  }

  const register = async (username: string, email: string, password: string) => {
    await registerWithEmail(email, password)
  }

  const loginWithGoogle = async () => {
    await googleLogin()
  }

  const loginDemo = async () => {
    await demoLogin()
  }

  const logout = async () => {
    logoutDemo()
    clearUser()
    await firebaseLogout()
  }

  const updateProfile = async (data: Partial<User>) => {
    if (demoUser) {
      setUser(prev => prev ? { ...prev, ...data } : null)
      return
    }
    
    if (!firebaseUser) throw new Error('Not authenticated')
    
    const token = await firebaseUser.getIdToken()
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
      const updatedUser = { ...user, ...userData, ...data }
      localStorage.setItem('cached_user', JSON.stringify(updatedUser))
    } else {
      throw new Error('Profile update failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginDemo, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
