import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SecuritySettings {
  emailVerified: boolean
  phoneVerified: boolean
  twoFactorEnabled: boolean
  lastLogin: Date
  loginHistory: any[]
}

export const useUserSecurity = () => {
  const { user } = useAuth()
  const [security, setSecurity] = useState<SecuritySettings>({
    emailVerified: false,
    phoneVerified: false,
    twoFactorEnabled: false,
    lastLogin: new Date(),
    loginHistory: []
  })
  const [loading, setLoading] = useState(false)

  const fetchSecurity = async () => {
    if (!user?.id) return
    
    try {
      const token = localStorage.getItem('demo_token')
      const headers: Record<string, string> = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const apiUrl = import.meta.env.PROD 
        ? window.location.origin 
        : 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/users/security`, { headers })
      if (response.ok) {
        const data = await response.json()
        setSecurity(data)
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error)
    }
  }

  const updateSecurity = async (updates: Partial<SecuritySettings>) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('demo_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const apiUrl = import.meta.env.PROD 
        ? window.location.origin 
        : 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/users/security`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const data = await response.json()
        setSecurity(prev => ({ ...prev, ...data }))
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update security settings:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurity()
  }, [user?.id])

  return {
    security,
    loading,
    updateSecurity,
    refreshSecurity: fetchSecurity
  }
}