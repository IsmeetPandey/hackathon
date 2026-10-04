import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Safe fallback for localConfig if JSON is missing or bundled differently
let localConfig: Record<string, string> = {};
try {
  localConfig = require('@/firebase-applet-config.json');
} catch {
  localConfig = {};
}

/**
 * Universal Firebase configuration resolution:
 * 1. Checks standard process.env.NEXT_PUBLIC_FIREBASE_* environment variables (used in Vercel, Netlify, Docker, custom hosting)
 * 2. Falls back to local firebase-applet-config.json (AI Studio native dev runtime)
 * 3. Falls back to active default project parameters to guarantee 0 runtime crashes
 */
export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    localConfig.apiKey ||
    'AIzaSyAKbO9LMibyms1KzclN4RtuvR7YQOYxydQ',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    localConfig.authDomain ||
    'idyllic-camp-bdtd0.firebaseapp.com',
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    localConfig.projectId ||
    'idyllic-camp-bdtd0',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    localConfig.storageBucket ||
    'idyllic-camp-bdtd0.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    localConfig.messagingSenderId ||
    '304725991314',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    localConfig.appId ||
    '1:304725991314:web:57c0e1a4be61d2c27b6b4b',
  firestoreDatabaseId:
    process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID ||
    localConfig.firestoreDatabaseId ||
    'ai-studio-campusconnectins-b93d183d-f76c-490e-a49f-ab320e7c3c42',
};

// Singleton Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication with durable browser local persistence
export const auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase auth persistence setup note:', err?.message || err);
  });
}

// Initialize Firestore with robust local caching & multi-tab synchronization
let dbInstance;
try {
  if (typeof window !== 'undefined') {
    dbInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } else {
    dbInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
} catch {
  // If already initialized or unsupported in current environment, fallback to standard getFirestore
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;

// Firebase Storage instance
export const storage = getStorage(app);

export default app;
