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
  addXP: (amount: number) => Promise<void>;
  updateWallet: (amount: number) => Promise<void>;
  subscribe: (productId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  toggleWishlist: async () => {},
  updateDisplayName: async () => {},
  addXP: async () => {},
  updateWallet: async () => {},
  subscribe: async () => {},
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
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);

            // Check for daily login reward
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = profile.lastLogin?.split('T')[0];

            if (lastLogin !== today) {
              const userRef = doc(db, 'users', firebaseUser.uid);
              try {
                await updateDoc(userRef, {
                  lastLogin: new Date().toISOString(),
                  xp: (profile.xp || 0) + 10,
                  level: Math.floor(((profile.xp || 0) + 10) / 1000) + 1,
                  notifications: arrayUnion({
                    id: Math.random().toString(36).substr(2, 9),
                    userId: firebaseUser.uid,
                    title: '🎁 مكافأة تسجيل الدخول اليومي',
                    message: 'لقد حصلت على 10 XP لتسجيل دخولك اليوم! استمر في التقدم.',
                    type: 'system',
                    createdAt: new Date().toISOString(),
                    read: false
                  })
                });
              } catch (error) {
                console.error("Error updating daily login:", error);
              }
            }
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

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'karmo2931@gmail.com' || user?.email === 'raskohilal99@gmail.com' || user?.email === 'rea2ife@gmail.com';

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

  const addXP = async (amount: number) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const currentXP = userProfile?.xp || 0;
    const newXP = currentXP + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;

    try {
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const subscribe = async (productId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const startDate = new Date().toISOString();
    const nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const newSubscription = {
      productId,
      startDate,
      nextBillingDate,
      status: 'active' as const
    };

    try {
      await updateDoc(userRef, {
        subscriptions: arrayUnion(newSubscription)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateWallet = async (amount: number) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const currentBalance = userProfile?.walletBalance || 0;
    const newBalance = currentBalance + amount;

    try {
      await updateDoc(userRef, {
        walletBalance: newBalance
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, toggleWishlist, updateDisplayName, addXP, updateWallet, subscribe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
