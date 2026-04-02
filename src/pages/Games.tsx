import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Game } from '../types';
import ProductCard from '../components/ProductCard';
import { Gamepad2, Search, Sparkles, Loader2, Mic, Filter, Camera } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { semanticSearch } from '../services/semanticSearchService';
import { cn } from '../lib/utils';
import VoiceSearch from '../components/VoiceSearch';
import ImageSearch from '../components/ImageSearch';

const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAISearch, setIsAISearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Game[] | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesSnap = await getDocs(query(collection(db, 'games'), orderBy('createdAt', 'desc')));
        const fetchedGames = gamesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
        setGames(fetchedGames);
        
        // Set initial max price based on data
        if (fetchedGames.length > 0) {
          const maxPrice = Math.max(...fetchedGames.map(g => g.ourPrice));
          setPriceRange([0, Math.ceil(maxPrice)]);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (isAISearch && debouncedSearchTerm.trim()) {
        setIsSearching(true);
        try {
          const results = await semanticSearch(debouncedSearchTerm);
          setSearchResults(results.filter(r => r.type === 'game') as unknown as Game[]);
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

  const filteredGames = (searchResults || games)
    .filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesPrice = game.ourPrice >= priceRange[0] && game.ourPrice <= priceRange[1];
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.ourPrice - b.ourPrice;
      if (sortBy === 'price-high') return b.ourPrice - a.ourPrice;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center text-center gap-6 mb-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
            <Gamepad2 className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic">مكتبة الألعاب</h1>
            <p className="text-gray-500 text-sm font-medium">استكشف مجموعتنا الكاملة من العناوين</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-2xl">
          <div className="flex flex-col gap-2 flex-1 sm:w-80">
            <div className="relative w-full flex items-center">
              {isSearching ? (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 w-5 h-5 animate-spin" />
              ) : (
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              )}
              <input
                type="text"
                placeholder={isAISearch ? "اسأل الذكاء الاصطناعي عن أي شيء..." : "بحث عن ألعاب..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-12 text-white focus:border-cyan-500 outline-none transition-all text-right"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button 
                  onClick={() => setIsImageSearchOpen(true)}
                  className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"
                  title="البحث بالصور"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <VoiceSearch onSearch={setSearchTerm} />
              </div>
            </div>
            <button
              onClick={() => setIsAISearch(!isAISearch)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest",
                isAISearch 
                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                  : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
              )}
            >
              <Sparkles className={cn("w-3 h-3", isAISearch && "fill-cyan-400")} />
              {isAISearch ? "بحث ذكي مفعل" : "تفعيل البحث الذكي (AI)"}
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <Filter className="w-4 h-4 text-gray-500" />
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

            <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 min-w-[200px]">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>السعر</span>
                <span>${priceRange[1]}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="10"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>
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
          {filteredGames.map(game => (
            <ProductCard key={game.id} item={game} type="game" />
          ))}
          {filteredGames.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500 italic">لم يتم العثور على ألعاب تطابق بحثك.</p>
            </div>
          )}
        </div>
      )}
      {isImageSearchOpen && (
        <ImageSearch 
          onResults={(results) => setGames(results as Game[])}
          onClose={() => setIsImageSearchOpen(false)}
        />
      )}
    </div>
  );
};

export default Games;
