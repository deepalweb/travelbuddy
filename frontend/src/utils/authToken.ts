import { auth } from '../lib/firebase'

export const isDemoSession = () => Boolean(localStorage.getItem('demo_token'))

export const getAuthToken = async (forceRefresh = false): Promise<string | null> => {
  if (isDemoSession()) {
    return localStorage.getItem('demo_token')
  }

  const firebaseUser = auth?.currentUser
  if (!firebaseUser) {
    return null
  }

  const token = await firebaseUser.getIdToken(forceRefresh)
  localStorage.setItem('token', token)
  return token
}
