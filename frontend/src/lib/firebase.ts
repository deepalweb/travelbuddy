import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { configService } from '../services/configService'

let app: FirebaseApp | null = null
let auth: Auth | null = null

const initializeFirebase = async () => {
  if (app) return { app, auth: auth! }
  
  const config = await configService.getConfig()
  
  const firebaseConfig = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId
  }

  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId
  })

  if (!firebaseConfig.apiKey) {
    console.error('Firebase API key is missing from runtime config')
  }

  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  
  return { app, auth }
}

export { initializeFirebase }
export { auth, app }