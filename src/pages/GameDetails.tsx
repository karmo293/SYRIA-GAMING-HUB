import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { Game, Product, Review } from '../types';
import { ExternalLink, TrendingDown, ShoppingCart, Tag, ChevronRight, Star, MessageSquare, Send, User, CreditCard, Heart, Monitor } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import ProductCard from '../components/ProductCard';
import HardwareChecker from '../components/HardwareChecker';
import PriceProtection from '../components/PriceProtection';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { usePersonalization } from '../hooks/usePersonalization';

const GameDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userProfile, toggleWishlist } = useAuth();
  const { addToCart } = useCart();
  const { trackInteraction } = usePersonalization();
  const [game, setGame] = useState<Game | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);
  const [showCartConfirm, setShowCartConfirm] = useState(false);
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const gameSnap = await getDoc(doc(db, 'games', id));
        if (gameSnap.exists()) {
          const gameData = { id: gameSnap.id, ...gameSnap.data() } as Game;
          setGame(gameData);
          trackInteraction(id, 'game');

          const productsSnap = await getDocs(query(collection(db, 'products'), where('gameId', '==', id)));
          setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time reviews listener
    if (id) {
      const q = query(
        collection(db, 'reviews'),
        where('gameId', '==', id),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      });

      return () => unsubscribe();
    }
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !comment.trim()) return;

    setSubmitting(true);
    try {
      const newReview = {
        gameId: id,
        userId: user.uid,
        userEmail: user.email,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'reviews'), newReview);
      
      // Update game's average rating denormalized on the game document
      const allReviewsSnap = await getDocs(query(collection(db, 'reviews'), where('gameId', '==', id)));
      const allReviews = allReviewsSnap.docs.map(doc => doc.data() as Review);
      const newRatingCount = allReviews.length;
      const newAverageRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / newRatingCount;
      
      await updateDoc(doc(db, 'games', id), {
        averageRating: newAverageRating,
        ratingCount: newRatingCount
      });

      setComment('');
      setRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("حدث خطأ أثناء إرسال التقييم.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!game) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 italic">Game not found.</p></div>;

  const priceDiff = game.steamPrice - game.ourPrice;
  const savingsPercent = Math.round((priceDiff / game.steamPrice) * 100);
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const isInWishlist = userProfile?.wishlist?.includes(game.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-8">
        <Link to="/" className="hover:text-cyan-400 transition-colors">الرئيسية</Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <Link to="/games" className="hover:text-cyan-400 transition-colors">الألعاب</Link>
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="text-gray-300">{game.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24"
          >
            <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={game.imageUrl}
                alt={game.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-7xl font-black uppercase italic mb-6 leading-none">
              {game.title}
            </h1>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-xl text-cyan-400 font-bold flex items-center gap-2">
                <TrendingDown className="w-5 h-5" /> وفر {savingsPercent}%
              </div>
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-gray-300 font-bold flex items-center gap-2">
                <Tag className="w-5 h-5" /> تسليم فوري
              </div>
              {reviews.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-xl text-yellow-500 font-bold flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-500" /> {avgRating} ({reviews.length} تقييم)
                </div>
              )}
            </div>

            <div className="prose prose-invert max-w-none mb-12">
              <p className="text-xl text-gray-400 leading-relaxed">
                {game.description}
              </p>
            </div>

            <PriceProtection 
              itemId={game.id} 
              itemTitle={game.title} 
              currentPrice={game.ourPrice} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-widest block mb-2">سعرنا</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">${game.ourPrice}</span>
                  <span className="text-gray-500 line-through text-lg">${game.steamPrice}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBuyConfirm(true)}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black py-4 rounded-2xl font-black uppercase tracking-wider text-lg flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
                  >
                    <CreditCard className="w-6 h-6" /> شراء الآن
                  </button>
                  <button
                    onClick={() => toggleWishlist(game.id)}
                    className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center transition-all border",
                      isInWishlist 
                        ? "bg-red-500/10 border-red-500/50 text-red-500" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Heart className={cn("w-6 h-6", isInWishlist && "fill-red-500")} />
                  </button>
                </div>
                <button
                  onClick={() => setShowCartConfirm(true)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-wider text-lg flex items-center justify-center gap-3 transition-all border border-white/10"
                >
                  <ShoppingCart className="w-6 h-6" /> إضافة للسلة
                </button>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden mb-12">
              <div className="p-4 bg-white/5 border-b border-white/10 font-bold uppercase tracking-widest text-xs flex items-center justify-between">
                <span>مقارنة الأسعار</span>
                <span className="text-cyan-400">وفر ${priceDiff}</span>
              </div>
              <table className="w-full text-right">
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-gray-400">سعر SYRIA GAMING HUB</td>
                    <td className="p-4 font-black text-cyan-400">${game.ourPrice}</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4 text-gray-400">متجر Steam</td>
                    <td className="p-4 font-bold text-gray-300">${game.steamPrice}</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-gray-400">توفيرك</td>
                    <td className="p-4 font-black text-green-400">-${priceDiff}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <a
              href={game.steamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs mb-12"
            >
              عرض على Steam <ExternalLink className="w-4 h-4" />
            </a>

            <HardwareChecker gameTitle={game.title} />
          </motion.div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        <div className="lg:col-span-7">
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-cyan-400 w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black uppercase italic">آراء اللاعبين</h2>
            </div>

            {user ? (
              <form onSubmit={handleReviewSubmit} className="bg-white/5 border border-white/10 p-6 rounded-3xl mb-12">
                <h3 className="font-bold mb-4">أضف تقييمك</h3>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star 
                        className={cn(
                          "w-8 h-8",
                          s <= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-600"
                        )} 
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ما رأيك في هذه اللعبة؟"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-cyan-500 outline-none transition-all min-h-[120px] mb-4 text-right"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black px-8 py-3 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  {submitting ? 'جاري الإرسال...' : <><Send className="w-4 h-4" /> إرسال التقييم</>}
                </button>
              </form>
            ) : (
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-12 text-center">
                <p className="text-gray-400 mb-4 font-medium">يجب عليك تسجيل الدخول لإضافة تقييم.</p>
                <Link to="/login" className="text-cyan-400 font-bold hover:underline">تسجيل الدخول الآن</Link>
              </div>
            )}

            <div className="space-y-6">
              {reviews.length === 0 ? (
                <p className="text-gray-500 italic text-center py-8">لا توجد تقييمات بعد. كن أول من يقيم!</p>
              ) : (
                reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{review.userEmail.split('@')[0]}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            {new Date(review.createdAt).toLocaleDateString('ar-EG')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn(
                              "w-3 h-3",
                              s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-700"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-right">{review.comment}</p>
                  </motion.div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Related Products */}
      {products.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Tag className="text-purple-400 w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black uppercase italic">منتجات ذات صلة</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <ProductCard key={product.id} item={product} type="product" />
            ))}
          </div>
        </section>
      )}

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        itemId={game.id}
        itemTitle={game.title}
        itemType="game"
      />

      <ConfirmationModal
        isOpen={showBuyConfirm}
        onClose={() => setShowBuyConfirm(false)}
        onConfirm={() => setIsModalOpen(true)}
        title="تأكيد الشراء"
        message={`هل أنت متأكد من رغبتك في شراء "${game.title}" الآن؟`}
        confirmText="نعم، شراء"
        cancelText="إلغاء"
      />

      <ConfirmationModal
        isOpen={showCartConfirm}
        onClose={() => setShowCartConfirm(false)}
        onConfirm={() => addToCart({
          id: game.id,
          title: game.title,
          price: game.ourPrice,
          imageUrl: game.imageUrl,
          type: 'game',
          quantity: 1
        })}
        title="تأكيد الإضافة"
        message={`هل تريد إضافة "${game.title}" إلى سلة التسوق؟`}
        confirmText="نعم، أضف"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default GameDetails;
