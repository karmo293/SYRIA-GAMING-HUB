import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { Product, Game } from '../types';
import { ShoppingCart, Tag, ChevronRight, Package, ShieldCheck, Zap, X, CreditCard, Heart } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { userProfile, toggleWishlist } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const productSnap = await getDoc(doc(db, 'products', id));
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() } as Product;
          setProduct(productData);

          if (productData.gameId) {
            const gameSnap = await getDoc(doc(db, 'games', productData.gameId));
            if (gameSnap.exists()) {
              setGame({ id: gameSnap.id, ...gameSnap.data() } as Game);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 italic">Product not found.</p></div>;

  const isInWishlist = userProfile?.wishlist?.includes(product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-8">
        <Link to="/" className="hover:text-cyan-400 transition-colors">الرئيسية</Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <Link to="/store" className="hover:text-cyan-400 transition-colors">المتجر</Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-300">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-video lg:aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5"
          >
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-xs font-bold uppercase tracking-widest">
                {product.category === 'Key' ? 'مفتاح' : product.category === 'Currency' ? 'عملة' : product.category === 'Subscription' ? 'اشتراك' : 'آخر'}
              </span>
              {game && (
                <Link to={`/game/${game.id}`} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                  <Package className="w-3 h-3" /> {game.title}
                </Link>
              )}
            </div>

            <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter mb-6 leading-none">
              {product.title}
            </h1>

            <div className="prose prose-invert max-w-none mb-10">
              <p className="text-xl text-gray-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">السعر</span>
                  <span className="text-5xl font-black text-white">${product.price}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-500 uppercase font-bold tracking-wider block mb-1">الحالة</span>
                  <span className="text-lg font-bold text-white">متوفر</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase tracking-wider text-xl flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  >
                    <CreditCard className="w-6 h-6" /> شراء الآن
                  </button>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center transition-all border",
                      isInWishlist 
                        ? "bg-red-500/10 border-red-500/50 text-red-500" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("w-7 h-7", isInWishlist && "fill-red-500")} />
                  </button>
                </div>
                <button
                  onClick={() => addToCart({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    type: 'product',
                    quantity: 1
                  })}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-wider text-xl flex items-center justify-center gap-3 transition-all border border-white/10"
                >
                  <ShoppingCart className="w-6 h-6" /> إضافة للسلة
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Zap className="text-cyan-400 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">تسليم فوري</h4>
                  <p className="text-xs text-gray-500">يصلك عبر البريد</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="text-cyan-400 w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">شراء آمن</h4>
                  <p className="text-xs text-gray-500">100% موثوق ومعتمد</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setShowConfirmation(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 text-right">تأكيد الطلب</h3>
                
                <div className="flex items-center gap-4 mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 text-right">
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg mb-1">{product.title}</h4>
                    <p className="text-cyan-400 font-black text-2xl">${product.price}</p>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      {product.category === 'Key' ? 'مفتاح تفعيل' : product.category === 'Currency' ? 'عملة رقمية' : 'اشتراك'}
                    </span>
                  </div>
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-5 rounded-2xl font-black uppercase tracking-wider text-lg transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  >
                    متابعة للدفع
                  </button>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-wider transition-all border border-white/10"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        itemId={product.id}
        itemTitle={product.title}
        itemType="product"
      />
    </div>
  );
};

export default ProductDetails;
