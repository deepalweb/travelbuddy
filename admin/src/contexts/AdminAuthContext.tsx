import React, { createContext, useContext, useState, useEffect } from 'react'

interface AdminUser {
  id: string
  email: string
  username: string
  isAdmin: boolean
}

interface AdminAuthContextType {
  user: AdminUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      try {
        const response = await fetch('http://localhost:3001/api/demo-auth/verify-token', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.user && data.user.isAdmin) {
            setUser(data.user)
          } else {
            localStorage.removeItem('admin_token')
          }
        } else {
          localStorage.removeItem('admin_token')
        }
      } catch (error) {
        localStorage.removeItem('admin_token')
      }
    }
    setIsLoading(false)
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/demo-auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      
      // Check if user is admin
      if (!data.user.isAdmin) {
        throw new Error('Access denied: Admin privileges required')
      }

      localStorage.setItem('admin_token', data.token)
      setUser(data.user)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
  }

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  )
}