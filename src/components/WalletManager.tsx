import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, History, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

const WalletManager: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState<'add' | 'withdraw' | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!userProfile) return null;

  const handleAction = async (type: 'add' | 'withdraw') => {
    if (!user || !amount || isNaN(Number(amount))) return;
    
    setLoading(true);
    setStatus('idle');
    
    try {
      const numAmount = Number(amount);
      const userRef = doc(db, 'users', user.uid);
      
      if (type === 'withdraw' && (userProfile.walletBalance || 0) < numAmount) {
        throw new Error('رصيد غير كافٍ');
      }

      await updateDoc(userRef, {
        walletBalance: increment(type === 'add' ? numAmount : -numAmount),
        notifications: arrayUnion({
          id: Math.random().toString(36).substring(2, 15),
          title: type === 'add' ? 'تمت إضافة رصيد' : 'طلب سحب رصيد',
          message: type === 'add' 
            ? `تمت إضافة $${numAmount} إلى محفظتك بنجاح.` 
            : `تم تقديم طلب سحب مبلغ $${numAmount}. سيتم المعالجة قريباً.`,
          type: 'system',
          createdAt: new Date().toISOString(),
          read: false
        })
      });

      setStatus('success');
      setTimeout(() => {
        setShowModal(null);
        setAmount('');
        setStatus('idle');
      }, 2000);
    } catch (error) {
      console.error("Wallet error:", error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Wallet className="text-black w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase italic text-white mb-1">إدارة المحفظة</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">الرصيد الحالي:</span>
              <span className="text-2xl font-black text-cyan-400">${userProfile.walletBalance?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setShowModal('add')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-5 h-5" />
            شحن رصيد
          </button>
          <button 
            onClick={() => setShowModal('withdraw')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-black uppercase tracking-wider transition-all"
          >
            <ArrowUpRight className="w-5 h-5" />
            سحب رصيد
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setShowModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] -z-10" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase italic text-white">
                  {showModal === 'add' ? 'شحن رصيد المحفظة' : 'سحب رصيد من المحفظة'}
                </h3>
                <button 
                  onClick={() => setShowModal(null)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {status === 'success' ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black uppercase italic mb-2">تمت العملية بنجاح!</h4>
                  <p className="text-gray-500">تم تحديث رصيد محفظتك بنجاح.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">المبلغ بالدولار ($)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-2xl font-black focus:border-cyan-500 outline-none transition-all text-center"
                      />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-cyan-500 font-black text-xl">$</div>
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {showModal === 'withdraw' ? 'رصيد غير كافٍ لإتمام العملية' : 'حدث خطأ ما، يرجى المحاولة لاحقاً'}
                    </div>
                  )}

                  <button
                    onClick={() => handleAction(showModal)}
                    disabled={loading || !amount || Number(amount) <= 0}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-cyan-500/20"
                  >
                    {loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        {showModal === 'add' ? <Plus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        {showModal === 'add' ? 'تأكيد الشحن' : 'تأكيد السحب'}
                      </>
                    )}
                  </button>
                  
                  <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                    * تخضع جميع العمليات لسياسة الاستخدام الخاصة بالمنصة.
                    <br />
                    * قد تستغرق عمليات السحب ما يصل إلى 24 ساعة للمراجعة.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletManager;
