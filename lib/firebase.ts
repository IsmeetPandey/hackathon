import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

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

