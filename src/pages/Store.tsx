import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Store, Search, Filter } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const StorePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = category === 'All' || product.category === category;
    return matchesSearch && matchesCategory;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/30">
            <Store className="text-purple-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">المتجر الرقمي</h1>
            <p className="text-gray-500 text-sm font-medium">مفاتيح، عملات، واشتراكات مميزة</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث عن منتجات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:border-purple-500 outline-none transition-all text-right"
            />
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
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
