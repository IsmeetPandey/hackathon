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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';

export const GUEST_USER: UserProfile = {
  id: '',
  username: 'Guest Student',
  handle: 'u/guest',
  email: '',
  avatarUrl: '',
  karma: '0',
  role: 'Student',
  department: '',
  rollNumber: '',
  isLoggedIn: false,
};

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
  const [userProfile, setUserProfile] = useState<UserProfile>(GUEST_USER);
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth state listener with Firestore profile
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
              username: data.displayName || firebaseUser.displayName || 'Campus Member',
              handle: data.handle || `u/${(data.displayName || firebaseUser.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
              email: firebaseUser.email || data.email || '',
              avatarUrl: data.avatarUrl || firebaseUser.photoURL || '',
              karma: String(data.karma ?? 100),
              role: data.role || 'Student',
              department: data.department || 'General Academic',
              rollNumber: data.rollNumber || '',
              isLoggedIn: true,
              createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt) : new Date().toISOString(),
            });
          } else {
            // Create genuine user profile in Firestore
            const initialDoc = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Campus Member',
              handle: `u/${(firebaseUser.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
              role: 'Student',
              department: 'General Academic',
              rollNumber: '',
              karma: 100,
              avatarUrl: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialDoc);

            setUserProfile({
              id: firebaseUser.uid,
              username: initialDoc.displayName,
              handle: initialDoc.handle,
              email: initialDoc.email,
              avatarUrl: initialDoc.avatarUrl,
              karma: String(initialDoc.karma),
              role: initialDoc.role,
              department: initialDoc.department,
              rollNumber: initialDoc.rollNumber,
              isLoggedIn: true,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Firestore profile sync error:', err);
          setUserProfile({
            id: firebaseUser.uid,
            username: firebaseUser.displayName || 'Campus Student',
            handle: `u/${(firebaseUser.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || '',
            karma: '100',
            role: 'Student',
            department: 'General Academic',
            rollNumber: '',
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(GUEST_USER);
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
        avatarUrl: data.avatarUrl || cred.user.photoURL || '',
        karma: String(data.karma ?? 100),
        role: data.role || 'Student',
        department: data.department || 'General Academic',
        rollNumber: data.rollNumber || '',
        isLoggedIn: true,
      };
    } else {
      profile = {
        id: cred.user.uid,
        username: cred.user.displayName || 'Campus Student',
        handle: `u/${(cred.user.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
        email: cred.user.email || '',
        avatarUrl: cred.user.photoURL || '',
        karma: '100',
        role: 'Student',
        department: 'General Academic',
        rollNumber: '',
        isLoggedIn: true,
      };
      await setDoc(userDocRef, {
        id: cred.user.uid,
        displayName: profile.username,
        handle: profile.handle,
        email: profile.email,
        role: profile.role,
        department: profile.department,
        rollNumber: '',
        karma: 100,
        createdAt: serverTimestamp(),
      });
    }
    setUserProfile(profile);
    return profile;
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: string = 'Student',
    dept: string = 'General Academic'
  ): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const handle = `u/${name.toLowerCase().replace(/\s+/g, '_')}`;
    const newDoc = {
      id: cred.user.uid,
      email,
      displayName: name,
      handle,
      role,
      department: dept,
      rollNumber: '',
      karma: 100,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), newDoc);

    const profile: UserProfile = {
      id: cred.user.uid,
      username: name,
      handle,
      email,
      avatarUrl: '',
      karma: '100',
      role,
      department: dept,
      rollNumber: '',
      isLoggedIn: true,
      createdAt: new Date().toISOString(),
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
        avatarUrl: data.avatarUrl || cred.user.photoURL || '',
        karma: String(data.karma ?? 100),
        role: data.role || 'Student',
        department: data.department || 'General Academic',
        rollNumber: data.rollNumber || '',
        isLoggedIn: true,
      };
    } else {
      const newDoc = {
        id: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || 'Campus Member',
        handle: `u/${(cred.user.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
        role: 'Student',
        department: 'General Academic',
        rollNumber: '',
        karma: 100,
        avatarUrl: cred.user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newDoc);

      profile = {
        id: cred.user.uid,
        username: newDoc.displayName,
        handle: newDoc.handle,
        email: newDoc.email,
        avatarUrl: cred.user.photoURL || '',
        karma: '100',
        role: newDoc.role,
        department: newDoc.department,
        rollNumber: '',
        isLoggedIn: true,
        createdAt: new Date().toISOString(),
      };
    }
    setUserProfile(profile);
    return profile;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(GUEST_USER);
  };

  const updateProfileData = async (updated: Partial<UserProfile>) => {
    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...updated,
        updatedAt: serverTimestamp(),
      }, { merge: true });
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
