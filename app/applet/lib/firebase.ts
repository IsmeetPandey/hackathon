import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import localConfig from '@/firebase-applet-config.json';

// Config resolution: prioritizes standard NEXT_PUBLIC_* env vars (for Vercel/production)
// and falls back to firebase-applet-config.json for AI Studio dev runtime
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

// Initialize Firebase App instance (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export Firebase Authentication instance
export const auth = getAuth(app);

// Export Cloud Firestore instance (with database ID support)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Export Firebase Storage instance for real attachments
export const storage = getStorage(app);

export default app;
