import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function getMissingFirebaseEnvVars(): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_ENV_VARS) {
    const val = import.meta.env[key];
    if (!val || typeof val !== 'string' || val.trim() === '' || val.includes('your_')) {
      missing.push(key);
    }
  }
  return missing;
}

export const missingFirebaseVars = getMissingFirebaseEnvVars();
export const isFirebaseConfigured = missingFirebaseVars.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.error('Failed to initialize Firebase SDK:', err);
  }
}

export { app, auth, db };

/**
 * Signs in using Firebase Google Auth with popup and fallback to redirect.
 * Returns the authenticated user or throws error with clear message.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase credentials are not configured. Check the setup instructions.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        throw new Error('Redirecting to Google sign-in...');
      } catch (redirectErr) {
        throw redirectErr;
      }
    }
    throw err;
  }
}

export async function signOutFirebase(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}
