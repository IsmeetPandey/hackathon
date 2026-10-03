'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  loginAsDemo: (role?: 'student' | 'faculty' | 'admin') => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateProfileData: (updated: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(GUEST_USER);
  const [isLoading, setIsLoading] = useState(true);

  // Check redirect login results on mount (useful for mobile and Vercel environments where popup is blocked)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const userDocRef = doc(db, 'users', result.user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              id: result.user.uid,
              username: data.displayName || result.user.displayName || 'Campus Member',
              handle:
                data.handle ||
                `u/${(data.displayName || result.user.displayName || 'student')
                  .toLowerCase()
                  .replace(/\s+/g, '_')}`,
              email: result.user.email || data.email || '',
              avatarUrl: data.avatarUrl || result.user.photoURL || '',
              karma: String(data.karma ?? 100),
              role: data.role || 'Student',
              department: data.department || 'General Academic',
              rollNumber: data.rollNumber || '',
              isLoggedIn: true,
              createdAt: data.createdAt
                ? typeof data.createdAt.toDate === 'function'
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt
                : new Date().toISOString(),
            });
          } else {
            const initialDoc = {
              id: result.user.uid,
              email: result.user.email || '',
              displayName: result.user.displayName || 'Campus Member',
              handle: `u/${(result.user.displayName || 'student')
                .toLowerCase()
                .replace(/\s+/g, '_')}`,
              role: 'Student',
              department: 'General Academic',
              rollNumber: '',
              karma: 100,
              avatarUrl: result.user.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialDoc).catch(() => {});
            setUserProfile({
              id: result.user.uid,
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
        }
      })
      .catch((err) => {
        console.warn('Redirect auth check notice:', err);
      });
  }, []);

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
              handle:
                data.handle ||
                `u/${(data.displayName || firebaseUser.displayName || 'student')
                  .toLowerCase()
                  .replace(/\s+/g, '_')}`,
              email: firebaseUser.email || data.email || '',
              avatarUrl: data.avatarUrl || firebaseUser.photoURL || '',
              karma: String(data.karma ?? 100),
              role: data.role || 'Student',
              department: data.department || 'General Academic',
              rollNumber: data.rollNumber || '',
              isLoggedIn: true,
              createdAt: data.createdAt
                ? typeof data.createdAt.toDate === 'function'
                  ? data.createdAt.toDate().toISOString()
                  : data.createdAt
                : new Date().toISOString(),
            });
          } else {
            // Create genuine user profile in Firestore
            const initialDoc = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Campus Member',
              handle: `u/${(firebaseUser.displayName || 'student')
                .toLowerCase()
                .replace(/\s+/g, '_')}`,
              role: 'Student',
              department: 'General Academic',
              rollNumber: '',
              karma: 100,
              avatarUrl: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userDocRef, initialDoc).catch(() => {});
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
            handle: `u/${(firebaseUser.displayName || 'student')
              .toLowerCase()
              .replace(/\s+/g, '_')}`,
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
        // If local demo session was active in state, preserve unless explicit logout
        setUserProfile((prev) => (prev?.id?.startsWith('demo-') ? prev : GUEST_USER));
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDoc = await getDoc(userDocRef);

      let profile: UserProfile;
      if (userDoc.exists()) {
        const data = userDoc.data();
        profile = {
          id: cred.user.uid,
          username: data.displayName || 'Campus Student',
          handle:
            data.handle ||
            `u/${(data.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
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
        }).catch(() => {});
      }

      setUserProfile(profile);
      return profile;
    } catch (err: any) {
      console.warn('Firebase signIn error, evaluating fallback/demo registration:', err);

      const isDemo =
        email.toLowerCase().includes('campus.edu') ||
        email.toLowerCase().includes('demo') ||
        email.toLowerCase().includes('21bce') ||
        email.toLowerCase().includes('fac-') ||
        email.toLowerCase().includes('student') ||
        email.toLowerCase().includes('faculty') ||
        email.toLowerCase().includes('admin');

      if (isDemo || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          // Attempt auto-register in Firebase Auth for seamless demo experience
          const cred = await createUserWithEmailAndPassword(auth, email, pass || 'demoPassword123');
          const isFaculty =
            email.toUpperCase().includes('FAC') || email.toLowerCase().includes('faculty');
          const defaultName = isFaculty ? 'Dr. Vikram Raman' : 'Ananya Sharma';
          const role = isFaculty ? 'Faculty' : 'Student';
          const dept = isFaculty
            ? 'Department of Computer Science'
            : 'Computer Science & Engineering';
          const roll = isFaculty ? 'FAC-9042' : '21BCE1084';

          const newDoc = {
            id: cred.user.uid,
            email,
            displayName: defaultName,
            handle: `u/${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            role,
            department: dept,
            rollNumber: roll,
            karma: 150,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(doc(db, 'users', cred.user.uid), newDoc).catch(() => {});

          const profile: UserProfile = {
            id: cred.user.uid,
            username: defaultName,
            handle: newDoc.handle,
            email,
            avatarUrl: '',
            karma: '150',
            role,
            department: dept,
            rollNumber: roll,
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(profile);
          return profile;
        } catch (regErr: any) {
          console.warn('Auto-create in Firebase Auth failed, using local demo profile:', regErr);
          const isFaculty =
            email.toUpperCase().includes('FAC') || email.toLowerCase().includes('faculty');
          const defaultName = isFaculty ? 'Dr. Vikram Raman' : 'Ananya Sharma';
          const role = isFaculty ? 'Faculty' : 'Student';
          const dept = isFaculty
            ? 'Department of Computer Science'
            : 'Computer Science & Engineering';
          const roll = isFaculty ? 'FAC-9042' : '21BCE1084';

          const demoProfile: UserProfile = {
            id: `demo-${isFaculty ? 'faculty' : 'student'}-${Date.now()}`,
            username: defaultName,
            handle: `u/${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            email: email,
            avatarUrl: '',
            karma: '250',
            role,
            department: dept,
            rollNumber: roll,
            isLoggedIn: true,
            createdAt: new Date().toISOString(),
          };
          setUserProfile(demoProfile);
          return demoProfile;
        }
      }
      throw err;
    }
  };

  const loginAsDemo = async (
    role: 'student' | 'faculty' | 'admin' = 'student'
  ): Promise<UserProfile> => {
    const isFaculty = role === 'faculty';
    const isAdmin = role === 'admin';
    const email = isFaculty
      ? 'FAC-9042@campus.edu'
      : isAdmin
      ? 'admin@campus.edu'
      : '21BCE1084@campus.edu';
    const pass = isFaculty ? 'facultyPass2024' : 'studentPass2024';
    const defaultName = isFaculty
      ? 'Dr. Vikram Raman'
      : isAdmin
      ? 'Dean of Academic Affairs'
      : 'Ananya Sharma';
    const userRole = isFaculty ? 'Faculty' : isAdmin ? 'Admin' : 'Student';
    const dept = isFaculty
      ? 'Department of Computer Science'
      : isAdmin
      ? 'Office of the Dean'
      : 'Computer Science & Engineering';
    const roll = isFaculty ? 'FAC-9042' : isAdmin ? 'ADM-001' : '21BCE1084';

    try {
      return await loginWithEmail(email, pass);
    } catch (err) {
      console.warn('Demo login fallback session:', err);
      const demoProfile: UserProfile = {
        id: `demo-${role}-${Date.now()}`,
        username: defaultName,
        handle: `u/${defaultName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        email,
        avatarUrl: '',
        karma: '250',
        role: userRole,
        department: dept,
        rollNumber: roll,
        isLoggedIn: true,
        createdAt: new Date().toISOString(),
      };
      setUserProfile(demoProfile);
      return demoProfile;
    }
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

    await setDoc(doc(db, 'users', cred.user.uid), newDoc).catch(() => {});

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
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    try {
      const cred = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDoc = await getDoc(userDocRef);

      let profile: UserProfile;
      if (userDoc.exists()) {
        const data = userDoc.data();
        profile = {
          id: cred.user.uid,
          username: data.displayName || cred.user.displayName || 'Campus Member',
          handle:
            data.handle ||
            `u/${(cred.user.displayName || 'student').toLowerCase().replace(/\s+/g, '_')}`,
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
        await setDoc(userDocRef, newDoc).catch(() => {});

        profile = {
          id: cred.user.uid,
          username: newDoc.displayName,
          handle: newDoc.handle,
          email: newDoc.email,
          avatarUrl: newDoc.avatarUrl,
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
    } catch (err: any) {
      console.warn('Google popup auth error, evaluating redirect/domain handling:', err);

      // Fallback to redirect if popup is blocked on mobile or external browser
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider);
        return GUEST_USER;
      }

      // Handle unauthorized-domain error when deployed to Vercel or custom domain
      if (err.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'your-domain';
        const customErr = new Error(
          `Domain "${host}" is not authorized in Firebase Console. Please add "${host}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`
        );
        (customErr as any).code = 'auth/unauthorized-domain';
        throw customErr;
      }

      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
    setUserProfile(GUEST_USER);
  };

  const updateProfileData = async (updated: Partial<UserProfile>) => {
    if (currentUser) {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          ...updated,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch(() => {});
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
        loginAsDemo,
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
