import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ExternalLink, Tag, Star, Plus } from 'lucide-react';
import { Game, Product } from '../types';
import { useCart } from '../context/CartContext';

interface CardProps {
  item: Game | Product;
  type: 'game' | 'product';
}

const ProductCard: React.FC<CardProps> = ({ item, type }) => {
  const { addToCart } = useCart();
  const isGame = type === 'game';
  const game = item as Game;
  const product = item as Product;
  const detailUrl = isGame ? `/game/${game.id}` : `/product/${product.id}`;
  const rating = item.averageRating || 0;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group flex flex-col h-full"
    >
      {/* Clickable Image - "The picture should be the entire game" */}
      <Link 
        to={detailUrl} 
        className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 group-hover:border-cyan-500/50 transition-all shadow-2xl block bg-white/5"
      >
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        {/* Category Tag */}
        <div className="absolute top-4 right-4">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
            <Tag className="w-3 h-3" /> {isGame ? 'لعبة' : (product.category === 'Key' ? 'مفتاح' : product.category === 'Currency' ? 'عملة' : product.category === 'Subscription' ? 'اشتراك' : 'آخر')}
          </div>
        </div>

        {/* Price Overlay on Image */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-cyan-500 text-black px-4 py-2 rounded-xl font-black text-xl shadow-2xl">
            ${isGame ? game.ourPrice : product.price}
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart({
              id: item.id,
              title: item.title,
              price: isGame ? game.ourPrice : product.price,
              imageUrl: item.imageUrl,
              type: isGame ? 'game' : 'product',
              quantity: 1
            });
          }}
          className="absolute bottom-4 right-4 bg-white/10 hover:bg-cyan-500 text-white hover:text-black p-3 rounded-xl backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
          title="إضافة للسلة"
        >
          <Plus className="w-5 h-5" />
        </button>
      </Link>

      {/* Content Directly Below Picture */}
      <div className="mt-5 flex items-center justify-between gap-4 px-2">
        {/* Name below picture */}
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white line-clamp-1 leading-none group-hover:text-cyan-400 transition-colors">
          {item.title}
        </h3>

        {/* Score on the side */}
        <div className="flex items-center gap-1 shrink-0 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-black text-gray-400">{rating > 0 ? rating.toFixed(1) : 'N/A'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
