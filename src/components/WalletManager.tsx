import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Plus, ArrowUpRight, History, CreditCard, Coins, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const WalletManager: React.FC = () => {
  const { userProfile, updateWallet } = useAuth();
  const [isRecharging, setIsRecharging] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  const rechargeOptions = [10, 25, 50, 100, 250];

  const handleRecharge = async () => {
    setLoading(true);
    try {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      await updateWallet(amount);
      setIsRecharging(false);
    } catch (error) {
      console.error("Recharge failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />
      
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Side: Balance & Actions */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
              <Wallet className="text-cyan-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">محفظة اللاعب</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">إدارة رصيدك الرقمي</p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-8 rounded-[2rem] mb-8 relative group">
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">الرصيد الحالي</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white italic tracking-tighter">
                ${userProfile.walletBalance?.toFixed(2) || '0.00'}
              </span>
              <span className="text-cyan-400 font-black text-xl uppercase italic">USD</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsRecharging(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-black py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <Plus className="w-5 h-5" />
              شحن الرصيد
            </button>
            <button className="bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/10">
              <History className="w-5 h-5" />
              السجل
            </button>
          </div>
        </div>

        {/* Right Side: Quick Stats / Info */}
        <div className="lg:w-80 space-y-4">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-green-400 w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest text-white">دفع آمن 100%</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
              جميع المعاملات المالية مشفرة ومؤمنة بأحدث تقنيات الحماية العالمية. رصيدك متاح للاستخدام الفوري في المتجر.
            </p>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/20 p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="text-cyan-400 w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400">مكافأة الشحن</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
              احصل على 5% نقاط إضافية عند شحن رصيدك بأكثر من $50. استخدم النقاط للحصول على خصومات حصرية.
            </p>
          </div>
        </div>
      </div>

      {/* Recharge Modal Overlay */}
      {isRecharging && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => !loading && setIsRecharging(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-black uppercase italic mb-6 text-center">شحن رصيد المحفظة</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              {rechargeOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAmount(opt)}
                  className={cn(
                    "py-3 rounded-xl font-black transition-all border",
                    amount === opt 
                      ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                  )}
                >
                  ${opt}
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-500 uppercase tracking-widest">المبلغ المختار</span>
                <span className="text-white">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-gray-500 uppercase tracking-widest">رسوم المعالجة</span>
                <span className="text-green-400 uppercase tracking-widest">مجاناً</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-lg font-black uppercase italic">الإجمالي</span>
                <span className="text-2xl font-black text-cyan-400">${amount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleRecharge}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black py-5 rounded-2xl font-black uppercase tracking-wider text-lg transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  تأكيد الدفع والشحن
                </>
              )}
            </button>
            
            <button 
              onClick={() => setIsRecharging(false)}
              disabled={loading}
              className="w-full mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              إلغاء العملية
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;
