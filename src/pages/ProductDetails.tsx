import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { Product, Game, Review } from '../types';
import { ShoppingCart, Tag, ChevronRight, Package, ShieldCheck, Zap, X, CreditCard, Heart, Sparkles, PlayCircle, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import ReverseAuction from '../components/ReverseAuction';
import ConfirmationModal from '../components/ConfirmationModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { getRecommendationsAI } from '../geminiService';

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { userProfile, toggleWishlist, subscribe } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [showCartConfirm, setShowCartConfirm] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const productSnap = await getDoc(doc(db, 'products', id));
        if (productSnap.exists()) {
          const productData = { id: productSnap.id, ...productSnap.data() } as Product;
          setProduct(productData);

          // Fetch Game if exists
          if (productData.gameId) {
            const gameSnap = await getDoc(doc(db, 'games', productData.gameId));
            if (gameSnap.exists()) {
              setGame({ id: gameSnap.id, ...gameSnap.data() } as Game);
            }
          }

          // Fetch Reviews
          const reviewsQuery = query(collection(db, 'reviews'), where('productId', '==', id), limit(5));
          const reviewsSnap = await getDocs(reviewsQuery);
          setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));

          // AI Recommendations
          const allProductsSnap = await getDocs(collection(db, 'products'));
          const allProducts = allProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          const recIds = await getRecommendationsAI(id, allProducts);
          setRecommendations(allProducts.filter(p => recIds.includes(p.id)));
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

            <h1 className="text-5xl md:text-6xl font-black uppercase italic mb-6 leading-none">
              {product.title}
            </h1>

            <div className="prose prose-invert max-w-none mb-10">
              <p className="text-xl text-gray-400 leading-relaxed">
                {product.description}
              </p>
            </div>

            {(!product.stock || product.stock === 0) && (
              <ReverseAuction 
                itemId={product.id} 
                itemTitle={product.title} 
                currentPrice={product.price} 
              />
            )}

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">السعر</span>
                  <span className="text-5xl font-black text-white">${product.price}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-500 uppercase font-bold tracking-wider block mb-1">الحالة</span>
                  <div className="flex items-center gap-2">
                    {product.stock && product.stock > 0 ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span className="text-lg font-bold text-white">متوفر ({product.stock})</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-lg font-bold text-red-500">نفذت الكمية</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {product.activationVideoUrl && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" /> طريقة التفعيل
                  </h3>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <iframe 
                      src={product.activationVideoUrl} 
                      className="w-full h-full" 
                      allowFullScreen 
                      title="Activation Guide"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {product.category === 'Subscription' ? (
                  <button
                    onClick={() => subscribe(product.id)}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-5 rounded-2xl font-black uppercase tracking-wider text-xl flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] mb-4"
                  >
                    <Sparkles className="w-6 h-6" /> اشتراك بضغطة واحدة
                  </button>
                ) : null}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBuyConfirm(true)}
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
                  onClick={() => setShowCartConfirm(true)}
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

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        itemId={product.id}
        itemTitle={product.title}
        itemType="product"
      />

      <ConfirmationModal
        isOpen={showBuyConfirm}
        onClose={() => setShowBuyConfirm(false)}
        onConfirm={() => setIsModalOpen(true)}
        title="تأكيد الشراء"
        message={`هل أنت متأكد من رغبتك في شراء "${product.title}" الآن؟`}
        confirmText="نعم، شراء"
        cancelText="إلغاء"
      />

      <ConfirmationModal
        isOpen={showCartConfirm}
        onClose={() => setShowCartConfirm(false)}
        onConfirm={() => addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          type: 'product',
          quantity: 1
        })}
        title="تأكيد الإضافة"
        message={`هل تريد إضافة "${product.title}" إلى سلة التسوق؟`}
        confirmText="نعم، أضف"
        cancelText="إلغاء"
      />

      <div className="mt-24">
        <h2 className="text-3xl font-black uppercase italic mb-12 flex items-center gap-3">
          <Sparkles className="text-cyan-400" /> قد يعجبك أيضاً
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {recommendations.map(rec => (
            <Link key={rec.id} to={`/product/${rec.id}`} className="glass-card p-6 block group">
              <div className="aspect-video rounded-xl overflow-hidden mb-4">
                <img src={rec.imageUrl} alt={rec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <h3 className="font-bold text-xl mb-2">{rec.title}</h3>
              <p className="text-cyan-400 font-black">${rec.price}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-24">
        <h2 className="text-3xl font-black uppercase italic mb-12 flex items-center gap-3">
          <Star className="text-yellow-400" /> تقييمات العملاء
        </h2>
        <div className="space-y-6">
          {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="glass-card p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-yellow-400" : "text-gray-600")} />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{review.userEmail.split('@')[0]}</span>
                  {review.isVerified && (
                    <span className="bg-green-500/10 text-green-500 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> مشتري مؤكد
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-400">{review.comment}</p>
              {review.imageUrl && (
                <div className="mt-4 w-32 h-32 rounded-xl overflow-hidden border border-white/10">
                  <img src={review.imageUrl} alt="Review" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )) : (
            <p className="text-gray-500 italic">لا توجد تقييمات بعد.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
