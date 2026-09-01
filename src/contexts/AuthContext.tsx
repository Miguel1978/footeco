import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isCoach: boolean;
  canEdit: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin email whitelist or pattern check
const ADMIN_EMAILS = [
  'rodrigues.miguel78@gmail.com',
  'admin@footeco.ch',
  'coach.miguel@footeco.ch',
  'coach.seb@footeco.ch'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync user profile from Firestore or create initial
  const fetchOrCreateProfile = async (firebaseUser: User): Promise<UserProfile> => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userRef);

      const email = firebaseUser.email || '';
      const isConfigAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || email.toLowerCase().includes('admin');
      const defaultRole: UserRole = isConfigAdmin ? 'admin' : 'coach';

      if (snapshot.exists()) {
        const data = snapshot.data();
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || data.displayName || 'Utilisateur',
          photoURL: firebaseUser.photoURL || data.photoURL || null,
          role: (data.role as UserRole) || defaultRole,
          lastLoginAt: new Date().toISOString(),
        };

        // Update last login
        await updateDoc(userRef, { lastLoginAt: new Date().toISOString() }).catch(() => {});
        return profile;
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Coach FE12',
          photoURL: firebaseUser.photoURL || null,
          role: defaultRole,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        await setDoc(userRef, newProfile).catch(console.error);
        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore profile load error, fallback to local role:', err);
      const isConfigAdmin = ADMIN_EMAILS.includes((firebaseUser.email || '').toLowerCase());
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Coach FE12',
        photoURL: firebaseUser.photoURL,
        role: isConfigAdmin ? 'admin' : 'coach',
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await fetchOrCreateProfile(currentUser);
          setUserProfile(profile);
        } catch (e) {
          console.error('Failed to resolve profile', e);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error('Email Sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && res.user) {
        await updateProfile(res.user, { displayName: name });
      }
    } catch (error: any) {
      console.error('Email Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: newRole, updatedAt: new Date().toISOString() });
      if (user?.uid === uid && userProfile) {
        setUserProfile({ ...userProfile, role: newRole });
      }
    } catch (error) {
      console.error('Failed to update role', error);
      throw error;
    }
  };

  const role: UserRole = userProfile?.role || 'viewer';
  const isAdmin = role === 'admin' || (user?.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false);
  const isCoach = role === 'coach' || isAdmin;
  const canEdit = isCoach || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role,
        isAdmin,
        isCoach,
        canEdit,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
