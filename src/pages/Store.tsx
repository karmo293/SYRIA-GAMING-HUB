import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Store, Search, Filter, Sparkles, Loader2, Mic, Camera } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { semanticSearch } from '../services/semanticSearchService';
import { cn } from '../lib/utils';
import VoiceSearch from '../components/VoiceSearch';
import ImageSearch from '../components/ImageSearch';

const StorePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [isAISearch, setIsAISearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        const fetchedProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(fetchedProducts);

        if (fetchedProducts.length > 0) {
          const maxPrice = Math.max(...fetchedProducts.map(p => p.price));
          setPriceRange([0, Math.ceil(maxPrice)]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (isAISearch && debouncedSearchTerm.trim()) {
        setIsSearching(true);
        try {
          const results = await semanticSearch(debouncedSearchTerm);
          setSearchResults(results.filter(r => r.type === 'product') as unknown as Product[]);
        } catch (error) {
          console.error("AI Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, isAISearch]);

  const filteredProducts = (searchResults || products)
    .filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = category === 'All' || product.category === category;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const categories = [
    { id: 'All', name: 'الكل' },
    { id: 'Key', name: 'مفاتيح' },
    { id: 'Currency', name: 'عملات' },
    { id: 'Subscription', name: 'اشتراكات' },
    { id: 'Other', name: 'أخرى' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center text-center gap-6 mb-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/30">
            <Store className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic">المتجر الرقمي</h1>
            <p className="text-gray-500 text-sm font-medium">مفاتيح، عملات، واشتراكات مميزة</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1 sm:w-64">
              <div className="relative w-full flex items-center">
                {isSearching ? (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5 animate-spin" />
                ) : (
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                )}
                <input
                  type="text"
                  placeholder={isAISearch ? "اسأل الذكاء الاصطناعي..." : "بحث عن منتجات..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-12 text-white focus:border-purple-500 outline-none transition-all text-right"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <VoiceSearch onSearch={setSearchTerm} />
                </div>
              </div>
              <button
                onClick={() => setIsAISearch(!isAISearch)}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest",
                  isAISearch 
                    ? "bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                    : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
                )}
              >
                <Sparkles className={cn("w-3 h-3", isAISearch && "fill-purple-400")} />
                {isAISearch ? "بحث ذكي مفعل" : "تفعيل البحث الذكي (AI)"}
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-fit">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-[#111]">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-fit">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                >
                  <option value="newest" className="bg-[#111]">الأحدث</option>
                  <option value="price-low" className="bg-[#111]">السعر: من الأقل للأعلى</option>
                  <option value="price-high" className="bg-[#111]">السعر: من الأعلى للأقل</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span>نطاق السعر</span>
              <span>${priceRange[1]}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[16/9] bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} item={product} type="product" />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500 italic">لم يتم العثور على منتجات تطابق بحثك.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorePage;
