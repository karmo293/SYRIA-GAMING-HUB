import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Sparkles, Gift, Loader2, Trophy, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from '@google/genai';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, Product } from '../types';
import { cn } from '../lib/utils';

const LootBox: React.FC = () => {
  const { userProfile, updateWallet, addXP } = useAuth();
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState('');

  const boxPrice = 5; // $5 per box

  const openBox = async () => {
    if (!userProfile || (userProfile.walletBalance || 0) < boxPrice) {
      setError('رصيدك غير كافٍ لفتح الصندوق.');
      return;
    }

    setOpening(true);
    setError('');
    setReward(null);

    try {
      // 1. Deduct balance
      await updateWallet(-boxPrice);

      // 2. Fetch some items to choose from
      const gamesSnap = await getDocs(query(collection(db, 'games'), limit(10)));
      const productsSnap = await getDocs(query(collection(db, 'products'), limit(10)));
      
      const allItems = [
        ...gamesSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'game' })),
        ...productsSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'product' }))
      ];

      // 3. Use AI to pick a "lucky" reward
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          أنت مدير "صندوق الحظ" (AI Loot Box) في متجر ألعاب.
          الميزانية المدفوعة: $${boxPrice}.
          يجب أن تكون قيمة الجائزة دائماً أعلى قليلاً من السعر المدفوع لضمان سعادة العميل.
          اختر عنصراً واحداً من القائمة التالية ليكون هو الجائزة:
          ${JSON.stringify(allItems.map(i => ({ id: i.id, title: (i as any).title, price: (i as any).ourPrice || (i as any).price })))}
          
          رد بصيغة JSON فقط:
          { "itemId": "id_here", "reason": "سبب الاختيار باللهجة السورية المحببة" }
        `,
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text);
      const selectedItem = allItems.find(i => i.id === result.itemId);

      if (selectedItem) {
        setReward({ ...selectedItem, reason: result.reason });
        await addXP(500); // Reward XP for opening a box
      } else {
        throw new Error('Failed to select reward');
      }
    } catch (err) {
      console.error('LootBox error:', err);
      setError('حدث خطأ أثناء فتح الصندوق. تم استرداد المبلغ.');
      await updateWallet(boxPrice); // Refund on error
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-yellow-500/10 rounded-3xl flex items-center justify-center border border-yellow-500/30 mx-auto mb-6"
        >
          <Box className="text-yellow-400 w-12 h-12" />
        </motion.div>
        <h1 className="text-5xl font-black uppercase italic mb-4">صندوق الحظ الذكي</h1>
        <p className="text-gray-500 text-lg font-medium">افتح الصندوق بـ <span className="text-yellow-400 font-black">$5</span> واحصل على جوائز قيمتها أعلى دائماً!</p>
      </div>

      <div className="relative flex justify-center items-center py-20">
        <AnimatePresence mode="wait">
          {!reward ? (
            <motion.div
              key="box"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
              className="relative group cursor-pointer"
              onClick={!opening ? openBox : undefined}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full group-hover:bg-yellow-500/40 transition-all" />
              
              <motion.div
                animate={opening ? { 
                  rotate: [0, -5, 5, -5, 5, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                } : {
                  y: [0, -20, 0]
                }}
                transition={opening ? { repeat: Infinity, duration: 0.5 } : { repeat: Infinity, duration: 3 }}
                className="relative z-10"
              >
                <Box className="w-64 h-64 text-yellow-500 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-white w-12 h-12 animate-pulse" />
                </div>
              </motion.div>

              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <p className="text-2xl font-black text-white uppercase italic">
                  {opening ? 'جاري الفتح...' : 'اضغط للفتح'}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="reward"
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="bg-white/5 border border-yellow-500/30 p-8 rounded-[40px] text-center max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
              
              <div className="w-32 h-32 mx-auto mb-6 rounded-3xl overflow-hidden border-4 border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
              </div>

              <h2 className="text-3xl font-black text-white mb-2 uppercase italic">{reward.title}</h2>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-gray-500 line-through text-lg">$5.00</span>
                <span className="text-yellow-400 font-black text-2xl">${reward.ourPrice || reward.price}</span>
              </div>

              <div className="bg-yellow-500/10 p-4 rounded-2xl mb-8 border border-yellow-500/20">
                <p className="text-yellow-200 italic font-medium">"{reward.reason}"</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setReward(null)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black py-4 rounded-2xl font-black uppercase italic transition-all"
                >
                  فتح صندوق آخر
                </button>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">تمت إضافة الجائزة إلى حسابك تلقائياً</p>
              </div>

              {/* Confetti Effect Simulation */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, x: 0, opacity: 1 }}
                    animate={{ 
                      y: 400, 
                      x: (Math.random() - 0.5) * 400,
                      rotate: 360,
                      opacity: 0 
                    }}
                    transition={{ duration: 2, delay: Math.random() * 0.5 }}
                    className="absolute w-2 h-2 bg-yellow-500 rounded-full"
                    style={{ left: '50%' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-center font-bold mt-4"
        >
          {error}
        </motion.p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
          <Trophy className="text-cyan-400 w-8 h-8 mx-auto mb-4" />
          <h4 className="text-white font-black uppercase italic">جوائز نادرة</h4>
          <p className="text-gray-500 text-xs">فرصة للحصول على ألعاب AAA</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
          <Coins className="text-yellow-400 w-8 h-8 mx-auto mb-4" />
          <h4 className="text-white font-black uppercase italic">قيمة مضمونة</h4>
          <p className="text-gray-500 text-xs">الجائزة دائماً أغلى من $5</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
          <Sparkles className="text-purple-400 w-8 h-8 mx-auto mb-4" />
          <h4 className="text-white font-black uppercase italic">ذكاء اصطناعي</h4>
          <p className="text-gray-500 text-xs">الذكاء الاصطناعي يختار لك الأفضل</p>
        </div>
      </div>
    </div>
  );
};

export default LootBox;
