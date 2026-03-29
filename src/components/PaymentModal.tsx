import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, CheckCircle2, CreditCard, Calendar, Lock, Loader2, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { doc, arrayUnion, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification, DeliveryType } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

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
  const { user } = useAuth();
  const { cartItems, clearCart, totalPrice } = useCart();
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.warn("Purchase attempted without user session");
      return;
    }
    if (!isCart && !itemId) {
      console.warn("Purchase attempted without itemId or isCart flag");
      return;
    }
    
    setStep('processing');
    console.log("Processing purchase...", { isCart, itemId, itemTitle, itemType });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const userRef = doc(db, 'users', user.uid);
      const notifications: Notification[] = [];
      const timestamp = new Date().toISOString();
      const orderId = generateId();

      if (isCart) {
        // Fetch full details for all items in cart to get delivery info
        for (const item of cartItems) {
          const collectionName = item.type === 'game' ? 'games' : 'products';
          let itemDoc;
          try {
            itemDoc = await getDoc(doc(db, collectionName, item.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `${collectionName}/${item.id}`);
            return;
          }
          
          if (itemDoc.exists()) {
            const data = itemDoc.data();
            notifications.push({
              id: generateId(),
              userId: user.uid,
              title: `تم شراء ${item.title} بنجاح`,
              message: `شكراً لشرائك ${item.title}. إليك تفاصيل التسليم الخاصة بك.`,
              type: 'purchase',
              createdAt: timestamp,
              read: false,
              itemId: item.id,
              itemTitle: item.title,
              deliveryType: data.deliveryType || 'Other',
              deliveryDetails: data.deliveryDetails || 'سيتم التواصل معك قريباً',
              deliveryInstructions: data.deliveryInstructions || '',
              deliveryStatus: 'Pending'
            });
          }
        }

        const gameIds = cartItems
          .filter(item => item.type === 'game')
          .map(item => item.id);
        
        console.log("Cart purchase: adding games and notifications", gameIds);
        
        const updateData: any = {};
        if (gameIds.length > 0) {
          updateData.ownedGames = arrayUnion(...gameIds);
        }
        if (notifications.length > 0) {
          updateData.notifications = arrayUnion(...notifications);
        }

        if (Object.keys(updateData).length > 0) {
          try {
            await setDoc(userRef, updateData, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            return;
          }
        }

        // Create Order document
        try {
          await setDoc(doc(db, 'orders', orderId), {
            id: orderId,
            userId: user.uid,
            userEmail: user.email || '',
            items: cartItems,
            totalAmount: totalPrice,
            status: 'completed',
            paymentMethod: 'Credit Card',
            createdAt: timestamp
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
          return;
        }

        clearCart();
      } else if (itemId) {
        // Single item purchase
        const collectionName = itemType === 'game' ? 'games' : 'products';
        let itemDoc;
        try {
          itemDoc = await getDoc(doc(db, collectionName, itemId));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `${collectionName}/${itemId}`);
          return;
        }
        
        if (itemDoc.exists()) {
          const data = itemDoc.data();
          const notification: Notification = {
            id: generateId(),
            userId: user.uid,
            title: `تم شراء ${itemTitle} بنجاح`,
            message: `شكراً لشرائك ${itemTitle}. إليك تفاصيل التسليم الخاصة بك.`,
            type: 'purchase',
            createdAt: timestamp,
            read: false,
            itemId: itemId,
            itemTitle: itemTitle || '',
            deliveryType: data.deliveryType || 'Other',
            deliveryDetails: data.deliveryDetails || 'سيتم التواصل معك قريباً',
            deliveryInstructions: data.deliveryInstructions || '',
            deliveryStatus: 'Pending'
          };

          const updateData: any = {
            notifications: arrayUnion(notification)
          };

          if (itemType === 'game') {
            updateData.ownedGames = arrayUnion(itemId);
          }

          try {
            await setDoc(userRef, updateData, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            return;
          }

          // Create Order document
          try {
            await setDoc(doc(db, 'orders', orderId), {
              id: orderId,
              userId: user.uid,
              userEmail: user.email || '',
              items: [{
                id: itemId,
                title: itemTitle || '',
                price: data.ourPrice || data.price || 0,
                imageUrl: data.imageUrl || '',
                type: itemType,
                quantity: 1
              }],
              totalAmount: data.ourPrice || data.price || 0,
              status: 'completed',
              paymentMethod: 'Credit Card',
              createdAt: timestamp
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
            return;
          }
        }
      }
      
      console.log("Purchase successful");
      setStep('success');
    } catch (error) {
      console.error("Error during purchase simulation:", error);
      setStep('form');
      // If it's already a JSON string from handleFirestoreError, we don't want to alert it directly
      // but the handleFirestoreError throws an Error with JSON string.
      alert('حدث خطأ أثناء معالجة العملية. يرجى المحاولة مرة أخرى.');
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
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">تسجيل الدخول مطلوب</h3>
                  <p className="text-gray-400 mb-8">يجب عليك تسجيل الدخول لإتمام عملية الشراء.</p>
                  <a
                    href="/login"
                    className="block w-full bg-cyan-500 hover:bg-cyan-600 text-black py-4 rounded-2xl font-black uppercase tracking-wider text-center transition-all"
                  >
                    تسجيل الدخول
                  </a>
                </div>
              ) : step === 'form' && (
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
                        <span className="text-cyan-400 font-black text-xl">${totalPrice.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="text-lg font-black text-white italic">{itemTitle}</span>
                    )}
                  </div>

                  <form onSubmit={handlePurchase} className="space-y-4">
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
                  
                  <p className="text-[10px] text-center text-gray-600 mt-6 uppercase font-bold tracking-widest">
                    هذه واجهة تجريبية فقط. لن يتم خصم أي مبالغ حقيقية.
                  </p>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-cyan-500/20 rounded-full" />
                    <Loader2 className="w-24 h-24 text-cyan-500 absolute top-0 left-0 animate-spin" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mt-8 mb-2">جاري المعالجة</h3>
                  <p className="text-gray-500 font-medium">يرجى الانتظار، نقوم بتأمين طلبك...</p>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-green-500/30">
                    <CheckCircle2 className="text-green-400 w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-4">تم الشراء بنجاح!</h3>
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
