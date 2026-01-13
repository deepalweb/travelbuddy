import { useState, useEffect, useCallback } from 'react'
import { logger } from '../utils/logger'

interface DemoUser {
  id: string
  email: string
  username: string
  tier: string
  role: string
  isAdmin: boolean
}

export const useDemoAuth = (apiBaseUrl?: string) => {
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)

  useEffect(() => {
    const demoToken = localStorage.getItem('demo_token')
    if (demoToken) {
      verifyDemoToken(demoToken)
    }
  }, [])

  const verifyDemoToken = async (token: string) => {
    try {
      const response = await fetch(`${apiBaseUrl || window.location.origin}/api/demo-auth/verify-token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDemoUser({
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
      logger.error('Demo token verification failed', error)
      localStorage.removeItem('demo_token')
    }
  }

  const loginDemo = useCallback(async () => {
    const user = {
      id: 'demo-user-123',
      email: 'admin@travelbuddy.com',
      username: 'Demo Admin',
      tier: 'premium',
      role: 'admin',
      isAdmin: true
    }
    
    setDemoUser(user)
    localStorage.setItem('demo_token', 'demo-token-123')
  }, [])

  const logoutDemo = useCallback(() => {
    setDemoUser(null)
    localStorage.removeItem('demo_token')
  }, [])

  return { demoUser, loginDemo, logoutDemo }
}
