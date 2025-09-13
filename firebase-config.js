// Firebase configuration (Vite env-driven, safe if missing)
import { initializeApp } from "firebase/app";

// Read from Vite env (must be prefixed with VITE_). Use direct access so Vite can inline values.
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID; // optional

const hasCoreConfig = Boolean(apiKey && authDomain && projectId && appId);
if (!hasCoreConfig && typeof window !== 'undefined') {
  const missing = [
    ['VITE_FIREBASE_API_KEY', apiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', authDomain],
    ['VITE_FIREBASE_PROJECT_ID', projectId],
    ['VITE_FIREBASE_APP_ID', appId],
  ].filter(([, v]) => !v).map(([k]) => k);
  console.warn('[Firebase] Missing required env vars:', missing);
}
let _app = null;
if (hasCoreConfig) {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
  _app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined' && measurementId) {
    import('firebase/analytics')
      .then(({ getAnalytics }) => {
        try { getAnalytics(_app); } catch {}
      })
      .catch(() => {});
  }
} else {
  // Non-fatal: app can run without Firebase; sign-in will be disabled until configured.
  console.warn(
    "Firebase is not configured. Set VITE_FIREBASE_* vars in .env to enable Google sign-in."
  );
}

export const getFirebaseApp = () => _app;
export const app = _app;

// Helpful diagnostic: which env vars are present
export const getFirebaseConfigStatus = () => ({
  hasCoreConfig,
  hasApiKey: !!apiKey,
  hasAuthDomain: !!authDomain,
  hasProjectId: !!projectId,
  hasAppId: !!appId,
  // optional values below
  hasStorageBucket: !!storageBucket,
  hasMessagingSenderId: !!messagingSenderId,
  hasMeasurementId: !!measurementId,
});