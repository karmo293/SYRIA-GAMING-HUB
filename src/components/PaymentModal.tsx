import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, CheckCircle2, CreditCard, Calendar, Lock, Loader2, Package, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { doc, arrayUnion, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification, DeliveryType } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
  itemTitle?: string;
  itemType?: 'game' | 'product';
  isCart?: boolean;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, itemId, itemTitle, itemType = 'game', isCart }) => {
  const { user, userProfile, updateWallet, addPoints } = useAuth();
  const { cartItems, clearCart, totalPrice: cartTotalPrice, pointsEarned } = useCart();
  const [step, setStep] = useState<'form' | 'confirm' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [singleItem, setSingleItem] = useState<{ price: number; imageUrl: string } | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [generatedCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());

  const currentTotalPrice = isCart ? cartTotalPrice : (singleItem?.price || 0);

  React.useEffect(() => {
    if (isOpen && !isCart && itemId) {
      const fetchPrice = async () => {
        setLoadingPrice(true);
        try {
          const collectionName = itemType === 'game' ? 'games' : 'products';
          const itemDoc = await getDoc(doc(db, collectionName, itemId));
          if (itemDoc.exists()) {
            const data = itemDoc.data();
            setSingleItem({
              price: data.ourPrice || data.price || 0,
              imageUrl: data.imageUrl || ''
            });
          }
        } catch (error) {
          console.error("Error fetching item price:", error);
        } finally {
          setLoadingPrice(false);
        }
      };
      fetchPrice();
    }
  }, [isOpen, isCart, itemId, itemType]);

  const handleProceedToConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep('confirm');
  };

  const handlePurchase = async () => {
    if (userInputCode !== generatedCode) {
      alert('كود التأكيد غير صحيح. يرجى المحاولة مرة أخرى.');
      return;
    }
    if (!user) {
      console.warn("Purchase attempted without user session");
      return;
    }
    
    setStep('processing');
    
    try {
      if (paymentMethod === 'card') {
        const items = isCart ? cartItems : [{
          id: itemId,
          title: itemTitle,
          price: singleItem?.price || 0,
          imageUrl: singleItem?.imageUrl || '',
          quantity: 1
        }];

        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            items
          })
        });

        const session = await response.json();
        if (session.url) {
          window.location.href = session.url;
          return;
        } else {
          throw new Error('Failed to create checkout session');
        }
      }

      // Wallet payment logic
      const pointsEarnedForThisPurchase = Math.floor(currentTotalPrice * 10);
      const idToken = await user.getIdToken(true);

      const response = await fetch('/api/pay-with-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          items: isCart ? cartItems : [{
            id: itemId,
            title: itemTitle || '',
            price: singleItem?.price || 0,
            imageUrl: singleItem?.imageUrl || '', 
            type: itemType,
            quantity: 1
          }],
          totalPrice: currentTotalPrice,
          pointsEarned: pointsEarnedForThisPurchase
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشلت عملية الدفع');
      }

      if (isCart) clearCart();
      
      console.log("Purchase successful");
      setStep('success');
    } catch (error) {
      console.error("Error during purchase simulation:", error);
      setStep('form');
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة العملية. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ cardNumber: '', expiry: '', cvv: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-[0_0_100px_rgba(6,182,212,0.15)] overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full" />
            
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              {!user ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-cyan-500/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border border-cyan-500/30">
                    <Lock className="text-cyan-400 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-4">تسجيل الدخول مطلوب</h3>
                  <p className="text-gray-400 mb-8">يجب عليك تسجيل الدخول لإتمام عملية الشراء.</p>
                  <a
                    href="/login"
                    className="block w-full bg-cyan-500 hover:bg-cyan-600 text-black py-4 rounded-2xl font-black uppercase tracking-wider text-center transition-all"
                  >
                    تسجيل الدخول
                  </a>
                </div>
              ) : step === 'form' ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                      <ShoppingCart className="text-cyan-400 w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter">بوابة الدفع الآمنة</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">محاكاة تجريبية</p>
                    </div>
                  </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-8">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                        {isCart ? 'إجمالي السلة' : 'المنتج'}
                      </span>
                      {isCart ? (
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-black text-white italic">طلب سلة التسوق</span>
                          <span className="text-cyan-400 font-black text-xl">${cartTotalPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-black text-white italic">{itemTitle}</span>
                          {loadingPrice ? (
                            <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                          ) : (
                            <span className="text-cyan-400 font-black text-xl">${singleItem?.price.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>

                  <div className="flex gap-4 mb-8">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                        paymentMethod === 'card' 
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" 
                          : "bg-white/5 border-white/10 text-gray-500"
                      )}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">بطاقة ائتمان</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={cn(
                        "flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                        paymentMethod === 'wallet' 
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-400" 
                          : "bg-white/5 border-white/10 text-gray-500"
                      )}
                    >
                      <Coins className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase">محفظة الألعاب</span>
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <form onSubmit={handleProceedToConfirm} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-1">رقم البطاقة</label>
                        <div className="relative">
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                          <input
                            type="text"
                            required
                            placeholder="0000 0000 0000 0000"
                            value={formData.cardNumber}
                            onChange={e => setFormData({...formData, cardNumber: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-cyan-500 outline-none transition-all text-right font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-1">تاريخ الانتهاء</label>
                          <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              value={formData.expiry}
                              onChange={e => setFormData({...formData, expiry: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-cyan-500 outline-none transition-all text-right font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-1">CVV</label>
                          <div className="relative">
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                            <input
                              type="text"
                              required
                              placeholder="123"
                              value={formData.cvv}
                              onChange={e => setFormData({...formData, cvv: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-cyan-500 outline-none transition-all text-right font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase tracking-wider text-lg mt-4 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                      >
                        إتمام عملية الشراء
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-3xl text-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">رصيدك الحالي</span>
                        <span className="text-3xl font-black text-yellow-400">${(userProfile?.walletBalance || 0).toFixed(2)}</span>
                      </div>
                      
                      <button
                        onClick={() => handleProceedToConfirm()}
                        disabled={loadingPrice || (userProfile?.walletBalance || 0) < currentTotalPrice}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 disabled:text-gray-500 text-black py-5 rounded-2xl font-black uppercase tracking-wider text-lg transition-all hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]"
                      >
                        {(userProfile?.walletBalance || 0) < currentTotalPrice ? 'رصيد غير كافٍ' : 'متابعة الشراء من المحفظة'}
                      </button>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-center text-gray-600 mt-6 uppercase font-bold tracking-widest">
                    هذه واجهة تجريبية فقط. لن يتم خصم أي مبالغ حقيقية.
                  </p>
                </motion.div>
              ) : step === 'confirm' ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-yellow-500/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border border-yellow-500/30">
                    <Lock className="text-yellow-400 w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mb-4">كود التأكيد مطلوب</h3>
                  <p className="text-gray-400 mb-8">يرجى إدخال كود التأكيد التالي لإتمام العملية:</p>
                  
                  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-8">
                    <span className="text-4xl font-black tracking-[0.5em] text-cyan-400 font-mono">{generatedCode}</span>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="أدخل الكود هنا"
                      value={userInputCode}
                      onChange={e => setUserInputCode(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 text-center text-2xl font-black tracking-[0.5em] text-white focus:border-cyan-500 outline-none transition-all font-mono"
                    />
                    
                    <button
                      onClick={() => handlePurchase()}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase tracking-wider text-lg transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                    >
                      تأكيد وإتمام الشراء
                    </button>
                    
                    <button
                      onClick={() => setStep('form')}
                      className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold uppercase tracking-wider transition-all border border-white/10"
                    >
                      رجوع
                    </button>
                  </div>
                </motion.div>
              ) : step === 'processing' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-cyan-500/20 rounded-full" />
                    <Loader2 className="w-24 h-24 text-cyan-500 absolute top-0 left-0 animate-spin" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic mt-8 mb-2">جاري المعالجة</h3>
                  <p className="text-gray-500 font-medium">يرجى الانتظار، نقوم بتأمين طلبك...</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-green-500/30">
                    <CheckCircle2 className="text-green-400 w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic mb-4">تم الشراء بنجاح!</h3>
                  <p className="text-gray-400 text-center leading-relaxed mb-10 px-4">
                    {isCart ? (
                      <>تهانينا! تمت معالجة طلبك بنجاح. ستجد الألعاب الجديدة في مكتبتك.</>
                    ) : (
                      <>تهانينا! تمت إضافة <span className="text-white font-bold">{itemTitle}</span> إلى مكتبتك الرقمية بنجاح.</>
                    )}
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-wider transition-all border border-white/10"
                  >
                    العودة للمتجر
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
