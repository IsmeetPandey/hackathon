'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { INITIAL_USER } from '@/lib/mockData';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile;
  isLoading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  registerWithEmail: (email: string, pass: string, name: string, role?: string, dept?: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfileData: (updated: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              id: firebaseUser.uid,
              username: data.displayName || firebaseUser.displayName || 'Campus Student',
              handle: data.handle || `u/${(data.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
              email: firebaseUser.email || '',
              avatarUrl: firebaseUser.photoURL || '',
              karma: String(data.karma || 420),
              role: data.role || 'Student',
              department: data.department || 'Computer Science & Engineering',
              rollNumber: data.rollNumber || '21BCE1084',
              isLoggedIn: true,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          } else {
            // Document doesn't exist yet, create initial profile in Firestore
            const initialDoc = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Campus Member',
              handle: `u/${(firebaseUser.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
              role: 'Student',
              department: 'Computer Science & Engineering',
              rollNumber: '21BCE1084',
              karma: 420,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialDoc);

            setUserProfile({
              id: firebaseUser.uid,
              username: initialDoc.displayName,
              handle: initialDoc.handle,
              email: initialDoc.email,
              avatarUrl: firebaseUser.photoURL || '',
              karma: String(initialDoc.karma),
              role: initialDoc.role,
              department: initialDoc.department,
              rollNumber: initialDoc.rollNumber,
              isLoggedIn: true,
              createdAt: initialDoc.createdAt,
            });
          }
        } catch (err) {
          console.warn('Firestore profile fetch fallback:', err);
          setUserProfile((prev) => ({
            ...prev,
            id: firebaseUser.uid,
            username: firebaseUser.displayName || prev.username,
            email: firebaseUser.email || prev.email,
            isLoggedIn: true,
          }));
        }
      } else {
        // Not logged in or logged out
        setUserProfile((prev) => ({
          ...prev,
          isLoggedIn: false,
        }));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userDocRef);

    let profile: UserProfile;
    if (userDoc.exists()) {
      const data = userDoc.data();
      profile = {
        id: cred.user.uid,
        username: data.displayName || 'Campus Student',
        handle: data.handle || `u/${(data.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
        email: cred.user.email || '',
        avatarUrl: cred.user.photoURL || '',
        karma: String(data.karma || 420),
        role: data.role || 'Student',
        department: data.department || 'Computer Science & Engineering',
        rollNumber: data.rollNumber || '21BCE1084',
        isLoggedIn: true,
      };
    } else {
      profile = {
        ...INITIAL_USER,
        id: cred.user.uid,
        email: cred.user.email || '',
        isLoggedIn: true,
      };
    }
    setUserProfile(profile);
    return profile;
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: string = 'Student',
    dept: string = 'Computer Science & Engineering'
  ): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newDoc = {
      id: cred.user.uid,
      email,
      displayName: name,
      handle: `u/${name.toLowerCase().replace(/\s+/g, '_')}`,
      role,
      department: dept,
      rollNumber: '21BCE1084',
      karma: 100,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), newDoc);

    const profile: UserProfile = {
      id: cred.user.uid,
      username: name,
      handle: newDoc.handle,
      email,
      avatarUrl: '',
      karma: '100',
      role,
      department: dept,
      rollNumber: '21BCE1084',
      isLoggedIn: true,
      createdAt: newDoc.createdAt,
    };
    setUserProfile(profile);
    return profile;
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userDocRef);

    let profile: UserProfile;
    if (userDoc.exists()) {
      const data = userDoc.data();
      profile = {
        id: cred.user.uid,
        username: data.displayName || cred.user.displayName || 'Campus Member',
        handle: data.handle || `u/${(cred.user.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
        email: cred.user.email || '',
        avatarUrl: cred.user.photoURL || '',
        karma: String(data.karma || 420),
        role: data.role || 'Student',
        department: data.department || 'Computer Science & Engineering',
        rollNumber: data.rollNumber || '21BCE1084',
        isLoggedIn: true,
      };
    } else {
      const newDoc = {
        id: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || 'Campus Member',
        handle: `u/${(cred.user.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
        role: 'Student',
        department: 'Computer Science & Engineering',
        rollNumber: '21BCE1084',
        karma: 350,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newDoc);

      profile = {
        id: cred.user.uid,
        username: newDoc.displayName,
        handle: newDoc.handle,
        email: newDoc.email,
        avatarUrl: cred.user.photoURL || '',
        karma: '350',
        role: newDoc.role,
        department: newDoc.department,
        rollNumber: newDoc.rollNumber,
        isLoggedIn: true,
        createdAt: newDoc.createdAt,
      };
    }
    setUserProfile(profile);
    return profile;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile((prev) => ({
      ...prev,
      isLoggedIn: false,
    }));
  };

  const updateProfileData = async (updated: Partial<UserProfile>) => {
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    }
    setUserProfile((prev) => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
