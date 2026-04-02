import { useEffect } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export const usePersonalization = () => {
  const { user, userProfile } = useAuth();

  const trackInteraction = async (itemId: string, type: 'game' | 'product', category?: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const interaction = {
        itemId,
        type,
        timestamp: new Date().toISOString()
      };

      const updates: any = {
        lastInteractions: arrayUnion(interaction)
      };

      if (category) {
        // If the user hasn't expressed interest in this category yet, add it
        if (!userProfile?.interests?.includes(category)) {
          updates.interests = arrayUnion(category);
        }
      }

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error("Error tracking interaction:", error);
    }
  };

  return { trackInteraction };
};
