import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  toggleWishlist: (itemId: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
  updateWallet: (amount: number) => Promise<void>;
  subscribe: (productId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isVendor: false,
  toggleWishlist: async () => {},
  updateDisplayName: async () => {},
  addXP: async () => {},
  addPoints: async () => {},
  updateWallet: async () => {},
  subscribe: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Get ID Token Result to check custom claims
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult(true); // Force refresh
          const role = idTokenResult.claims.role as string;
          setIsAdmin(role === 'admin');
          setIsVendor(role === 'vendor');
        } catch (error) {
          console.error("Error getting custom claims:", error);
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);

            // Fallback: Check role from Firestore if custom claims haven't updated yet
            if (profile.role === 'admin') {
              setIsAdmin(true);
            }

            // Check for daily login reward
            const today = new Date().toISOString().split('T')[0];
            const lastLogin = profile.lastLogin?.split('T')[0];

            if (lastLogin !== today) {
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

            // Check for daily point deduction (10 points every 24 hours)
            const now = new Date();
            const lastDeduction = profile.lastPointDeduction ? new Date(profile.lastPointDeduction) : new Date(profile.createdAt);
            const diffInMs = now.getTime() - lastDeduction.getTime();
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

            if (diffInMs >= twentyFourHoursInMs) {
              const numDeductions = Math.floor(diffInMs / twentyFourHoursInMs);
              const totalDeduction = numDeductions * 10;
              const currentPoints = profile.points || 0;
              const newPoints = Math.max(0, currentPoints - totalDeduction);

              try {
                await updateDoc(userRef, {
                  points: newPoints,
                  lastPointDeduction: new Date().toISOString(),
                  notifications: arrayUnion({
                    id: Math.random().toString(36).substr(2, 9),
                    userId: firebaseUser.uid,
                    title: '📉 خصم النقاط اليومي',
                    message: `تم خصم ${totalDeduction} نقطة (10 نقاط لكل 24 ساعة). رصيدك الحالي: ${newPoints} نقطة.`,
                    type: 'system',
                    createdAt: new Date().toISOString(),
                    read: false
                  })
                });
              } catch (error) {
                console.error("Error updating daily point deduction:", error);
              }
            }
          } else {
            // Create user profile if it doesn't exist
            try {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                role: 'user',
                createdAt: new Date().toISOString(),
                xp: 0,
                level: 1,
                walletBalance: 0,
                points: 0,
                lastPointDeduction: new Date().toISOString(),
                wishlist: [],
                ownedGames: [],
                notifications: []
              };
              await setDoc(userRef, newProfile);
              setUserProfile(newProfile);
            } catch (error) {
              console.error("Error creating user profile:", error);
            }
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

    const [isAdmin, setIsAdmin] = useState(false);
    const [isVendor, setIsVendor] = useState(false);

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

  const addPoints = async (amount: number) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const currentPoints = userProfile?.points || 0;
    const newPoints = currentPoints + amount;

    try {
      await updateDoc(userRef, {
        points: newPoints
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
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, isVendor, toggleWishlist, updateDisplayName, addXP, addPoints, updateWallet, subscribe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
