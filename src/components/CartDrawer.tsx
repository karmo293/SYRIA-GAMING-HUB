import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import PaymentModal from './PaymentModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, totalPrice, itemCount } = useCart();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                    <ShoppingBag className="text-cyan-400 w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter">سلة التسوق</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{itemCount} منتجات</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <ShoppingBag className="text-gray-600 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">السلة فارغة</h3>
                    <p className="text-gray-500 text-sm mb-8">لم تقم بإضافة أي منتجات بعد</p>
                    <button
                      onClick={onClose}
                      className="bg-cyan-500 hover:bg-cyan-600 text-black px-8 py-3 rounded-xl font-bold transition-all"
                    >
                      تصفح المتجر
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-24 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-cyan-400 font-black text-sm mt-1">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-white/10 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-white/10 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>المجموع الفرعي</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black italic uppercase tracking-tighter">
                      <span>الإجمالي</span>
                      <span className="text-cyan-400">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                  >
                    <CreditCard className="w-5 h-5" />
                    إتمام الدفع
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        isCart
      />
    </>
  );
};

export default CartDrawer;
