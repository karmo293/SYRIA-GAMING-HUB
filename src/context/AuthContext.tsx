import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  toggleWishlist: (itemId: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  toggleWishlist: async () => {},
  updateDisplayName: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'karmo2931@gmail.com';

  const toggleWishlist = async (itemId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const isInWishlist = userProfile?.wishlist?.includes(itemId);

    try {
      await updateDoc(userRef, {
        wishlist: isInWishlist ? arrayRemove(itemId) : arrayUnion(itemId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateDisplayName = async (name: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, {
        displayName: name
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, toggleWishlist, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
