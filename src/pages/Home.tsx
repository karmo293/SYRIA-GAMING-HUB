import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { Game, Product } from '../types';
import Hero from '../components/Hero';
import DailyMissions from '../components/DailyMissions';
import ProductCard from '../components/ProductCard';
import { Gamepad2, Store, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { handleFirestoreError, OperationType } from '../utils/errorHandlers';

const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching home data...");
      try {
        const gamesSnap = await getDocs(query(collection(db, 'games'), limit(4)));
        console.log("Games fetched:", gamesSnap.size);
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(8)));
        console.log("Products fetched:", productsSnap.size);

        setGames(gamesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game)));
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

        // Simple recommendation logic based on interests
        if (userProfile?.interests && userProfile.interests.length > 0) {
          const recs = productsData.filter(p => userProfile.interests?.includes(p.category)).slice(0, 4);
          setRecommended(recs);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'games/products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Hero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Recommended Section */}
        {recommended.length > 0 && (
          <section className="mb-24">
            <div className="flex flex-col items-center text-center mb-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                  <Sparkles className="text-cyan-400 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase italic">مقترح لك</h2>
                  <p className="text-gray-500 text-sm font-medium">بناءً على اهتماماتك السابقة</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommended.map(item => (
                <ProductCard key={item.id} item={item} type="product" />
              ))}
            </div>
          </section>
        )}

        {/* Featured Games Section */}
        <section className="mb-24">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                <Gamepad2 className="text-cyan-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase italic">ألعاب مميزة</h2>
                <p className="text-gray-500 text-sm font-medium">أفضل الاختيارات من مجموعتنا</p>
              </div>
            </div>
            <Link to="/games" className="text-cyan-400 hover:text-cyan-300 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group">
              عرض الكل <div className="w-6 h-[1px] bg-cyan-400 group-hover:w-10 transition-all" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-pulse flex flex-col h-full">
                  <div className="aspect-[3/4] bg-white/10" />
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="h-6 bg-white/10 rounded w-3/4" />
                      <div className="h-6 bg-white/10 rounded w-12" />
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                      <div className="w-5 h-5 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {games.map(game => (
                <ProductCard key={game.id} item={game} type="game" />
              ))}
              {games.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-500 italic">لا توجد ألعاب حالياً. أضف بعضاً منها من لوحة التحكم!</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Latest Products Section */}
        <section>
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/30">
                <Store className="text-purple-400 w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase italic">أحدث المنتجات</h2>
                <p className="text-gray-500 text-sm font-medium">مفاتيح، عملات، واشتراكات</p>
              </div>
            </div>
            <Link to="/store" className="text-purple-400 hover:text-purple-300 font-bold text-sm uppercase tracking-widest flex items-center gap-2 group">
              عرض الكل <div className="w-6 h-[1px] bg-purple-400 group-hover:w-10 transition-all" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-pulse flex flex-col h-full">
                  <div className="aspect-[3/4] bg-white/10" />
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="h-6 bg-white/10 rounded w-3/4" />
                      <div className="h-6 bg-white/10 rounded w-12" />
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                      <div className="w-5 h-5 bg-white/10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} item={product} type="product" />
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-500 italic">لا توجد منتجات حالياً. أضف بعضاً منها من لوحة التحكم!</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
