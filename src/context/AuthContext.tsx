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
          const isAdminClaim = !!idTokenResult.claims.admin;
          const role = idTokenResult.claims.role as string;
          setIsAdmin(isAdminClaim || role === 'admin' || (firebaseUser.email === 'karmo2931@gmail.com' && firebaseUser.emailVerified));
          setIsVendor(role === 'vendor');
        } catch (error) {
          console.error("Error getting custom claims:", error);
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        console.log("Listening to user profile:", userRef.path);
        
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);

            // Fallback: Check role from Firestore if custom claims haven't updated yet
            if (profile.role === 'admin') {
              setIsAdmin(true);
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
              handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
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
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/wallet/add-xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to add XP');
    } catch (error) {
      console.error("Error adding XP:", error);
    }
  };

  const addPoints = async (amount: number) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/wallet/add-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to add points');
    } catch (error) {
      console.error("Error adding points:", error);
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
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to recharge wallet');
    } catch (error) {
      console.error("Error recharging wallet:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, isVendor, toggleWishlist, updateDisplayName, addXP, addPoints, updateWallet, subscribe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
