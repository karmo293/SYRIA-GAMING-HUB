import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, TrendingDown, Clock, Info, CheckCircle2, Loader2, Send, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface ReverseAuctionProps {
  itemId: string;
  itemTitle: string;
  currentPrice: number;
}

const ReverseAuction: React.FC<ReverseAuctionProps> = ({ itemId, itemTitle, currentPrice }) => {
  const { user } = useAuth();
  const [bidPrice, setBidPrice] = useState(Math.floor(currentPrice * 0.9));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
 
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'bids'), {
        itemId,
        itemTitle,
        userId: user.uid,
        userEmail: user.email,
        bidPrice,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
 
      setShowSuccess(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error submitting bid:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -z-10" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/30">
          <Gavel className="text-yellow-500 w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">المزاد العكسي الذكي</h3>
          <p className="text-gray-500 text-xs font-medium">قدم عرضك الخاص لهذا المنتج</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 text-right">
            هذا المنتج غير متوفر حالياً أو يتوفر بكميات محدودة جداً. يمكنك تقديم "عرض سعر" خاص بك، وسنقوم بمراجعته وتوفير المنتج لك إذا تمت الموافقة على السعر.
          </p>
          <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
            <TrendingDown className="text-yellow-500 w-5 h-5" />
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
              نصيحة: العروض القريبة من السعر الأصلي لديها فرصة أكبر للقبول.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitBid} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">سعرك المقترح ($)</label>
            <div className="relative">
              <input
                type="number"
                value={bidPrice}
                onChange={(e) => setBidPrice(Number(e.target.value))}
                min={1}
                max={currentPrice * 1.5}
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-2xl font-black text-white focus:border-yellow-500 outline-none transition-all text-center"
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-500 font-black text-xl">$</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !user}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 text-black py-5 rounded-2xl font-black uppercase italic tracking-tighter text-lg transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(234,179,8,0.2)]"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                تقديم العرض الآن
              </>
            )}
          </button>

          {!user && (
            <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
              * يجب تسجيل الدخول لتقديم عرض
            </p>
          )}
        </form>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 bg-[#0a0a0a] z-20 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-green-500/30">
              <CheckCircle2 className="text-green-500 w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">تم استلام عرضك!</h4>
            <p className="text-gray-500 text-sm mb-8 max-w-xs">
              سنقوم بمراجعة عرضك والتواصل معك عبر البريد الإلكتروني في حال الموافقة.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all border border-white/10"
            >
              إغلاق
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReverseAuction;
