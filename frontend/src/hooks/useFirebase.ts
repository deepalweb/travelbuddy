import { useEffect, useState } from 'react'
import { initializeFirebase } from '../lib/firebase'
import { Auth, FirebaseApp } from 'firebase/auth'

export const useFirebase = () => {
  const [firebase, setFirebase] = useState<{ app: FirebaseApp; auth: Auth } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { app, auth } = await initializeFirebase()
        setFirebase({ app, auth })
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Firebase')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return { firebase, loading, error }
}