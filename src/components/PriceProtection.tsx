import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Clock, Info, CheckCircle2, Loader2, Lock, AlertCircle } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface PriceProtectionProps {
  itemId: string;
  itemTitle: string;
  currentPrice: number;
}

const PriceProtection: React.FC<PriceProtectionProps> = ({ itemId, itemTitle, currentPrice }) => {
  const { user, userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const protectionFee = 0.99; // Mock fee
  const isProtected = userProfile?.lockedPrices?.some(p => p.itemId === itemId && new Date(p.expiresAt) > new Date());

  const handleProtectPrice = async () => {
    if (!user || !userProfile) return;
    if (userProfile.walletBalance && userProfile.walletBalance < protectionFee) {
      alert('رصيدك غير كافٍ لتأمين السعر.');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(async () => {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          walletBalance: (userProfile.walletBalance || 0) - protectionFee,
          lockedPrices: arrayUnion({
            itemId,
            price: currentPrice,
            expiresAt: expiresAt.toISOString()
          })
        });

        setShowSuccess(true);
        setIsProcessing(false);
      } catch (error) {
        console.error("Error protecting price:", error);
        setIsProcessing(false);
      }
    }, 1500);
  };

  if (isProtected) {
    const protectedData = userProfile?.lockedPrices?.find(p => p.itemId === itemId);
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-green-500 w-5 h-5" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500">السعر مؤمن لمدة 24 ساعة</p>
            <p className="text-sm font-bold text-white">السعر المحجوز: ${protectedData?.price}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-500 uppercase">ينتهي في</div>
          <div className="text-xs font-mono text-white">
            {new Date(protectedData?.expiresAt || '').toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] -z-10" />
      
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-cyan-400 w-4 h-4" />
            <h4 className="text-sm font-black uppercase italic text-white">تأمين السعر (Price Protection)</h4>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs">
            ادفع <span className="text-cyan-400 font-bold">${protectionFee}</span> فقط لتأمين هذا السعر لمدة 24 ساعة، حتى لو ارتفع السعر عالمياً.
          </p>
        </div>

        <button
          onClick={handleProtectPrice}
          disabled={isProcessing || !user}
          className="bg-white/10 hover:bg-cyan-500 hover:text-black text-white px-6 py-3 rounded-xl font-black uppercase italic text-xs transition-all border border-white/10 whitespace-nowrap"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأمين السعر الآن'}
        </button>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-cyan-500 flex items-center justify-center gap-3 z-20"
          >
            <CheckCircle2 className="text-black w-6 h-6" />
            <span className="text-black font-black uppercase italic">تم تأمين السعر بنجاح!</span>
            <button 
              onClick={() => setShowSuccess(false)}
              className="absolute top-2 right-2 text-black/50 hover:text-black"
            >
              <Info className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceProtection;
