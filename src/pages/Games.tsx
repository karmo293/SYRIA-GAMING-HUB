import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Game } from '../types';
import ProductCard from '../components/ProductCard';
import { Gamepad2, Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const Games: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesSnap = await getDocs(query(collection(db, 'games'), orderBy('createdAt', 'desc')));
        setGames(gamesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game)));
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
            <Gamepad2 className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">مكتبة الألعاب</h1>
            <p className="text-gray-500 text-sm font-medium">استكشف مجموعتنا الكاملة من العناوين</p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="بحث عن ألعاب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:border-cyan-500 outline-none transition-all text-right"
          />
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
    </div>
  );
};

export default Games;
