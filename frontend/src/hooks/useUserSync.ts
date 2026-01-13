import { useState, useCallback } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { logger } from '../utils/logger'

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

export const useUserSync = (apiBaseUrl?: string) => {
  const [user, setUser] = useState<User | null>(null)

  const syncUser = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken()
      localStorage.setItem('token', token)
      
      const response = await fetch(`${apiBaseUrl || window.location.origin}/api/users/sync`, {
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
        localStorage.setItem('cached_user', JSON.stringify(userObj))
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      logger.error('User sync failed, using fallback', error)
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
  }, [apiBaseUrl])

  const clearUser = useCallback(() => {
    setUser(null)
    localStorage.removeItem('cached_user')
    localStorage.removeItem('token')
  }, [])

  return { user, setUser, syncUser, clearUser }
}
