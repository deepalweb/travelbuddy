import { useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export const useFirebaseAuth = () => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized')
    await signInWithEmailAndPassword(auth, email, password)
  }

  const registerWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized')
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const loginWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not initialized')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    if (auth) await signOut(auth)
  }

  return { firebaseUser, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout }
}
