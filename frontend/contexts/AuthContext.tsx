import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getFirebaseApp, getFirebaseConfigStatus } from '../../firebase-config';

type AuthUser = Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL'> | null;

interface AuthContextValue {
  user: AuthUser;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const firebaseApp = useMemo(() => getFirebaseApp(), []);
  const auth = useMemo(() => (firebaseApp ? getAuth(firebaseApp) : null), [firebaseApp]);
  useEffect(() => {
    if (!auth) {
      const s = getFirebaseConfigStatus?.();
      if (s) {
  console.warn('[Auth] Firebase not configured. Missing:', Object.entries(s).filter(([,v]) => typeof v === 'boolean' && !v));
      }
    }
  }, [auth]);

  useEffect(() => {
    if (!auth) {
      // Firebase not configured; no auth state
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({ uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.warn('Firebase auth is not configured - Google sign-in disabled');
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      console.warn('Firebase auth is not configured - email sign-in disabled');
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    if (!auth) {
      console.warn('Firebase auth is not configured - registration disabled');
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      try { await updateProfile(cred.user, { displayName }); } catch {}
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      console.warn('Firebase auth is not configured - password reset disabled');
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const signOutFn = async () => {
    if (!auth) return;
    await auth.signOut();
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!auth) return null;
    const u = auth.currentUser;
    if (!u) return null;
    return await u.getIdToken();
  };

  const value: AuthContextValue = { user, loading, isConfigured: !!auth, signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword, signOut: signOutFn, getIdToken };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
