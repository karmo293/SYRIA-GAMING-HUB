import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Gamepad2, Zap, ShieldCheck, MessageSquare, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <div className="relative h-[80vh] flex items-center overflow-hidden">
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/gaming/1920/1080?blur=10')] bg-cover bg-center opacity-20 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/50 to-black" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" /> عروض الموسم الجديد الحصرية
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[1.1] mb-8 uppercase italic text-white">
            وجهتك الأولى <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 py-2 inline-block">لأفضل المنتجات الرقمية</span>
          </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-2xl mx-auto">
            {[
              { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: "تسليم فوري" },
              { icon: <ShieldCheck className="w-4 h-4 text-green-400" />, text: "دفع آمن" },
              { icon: <Gamepad2 className="w-4 h-4 text-cyan-400" />, text: "مفاتيح أصلية" },
              { icon: <MessageSquare className="w-4 h-4 text-purple-400" />, text: "دعم 24/7" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                {item.icon}
                <span className="text-xs font-bold text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/store"
                className="group relative bg-cyan-500 hover:bg-cyan-400 text-black px-12 py-6 rounded-2xl font-black uppercase tracking-wider flex items-center gap-4 transition-all hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <Flame className="w-6 h-6 text-orange-600 group-hover:scale-125 transition-transform animate-pulse" />
                </div>
                <span className="relative z-10">تصفح المتجر الآن</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform rotate-180" />
              </Link>
            </motion.div>
            
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-cyan-400/80 animate-pulse">
                🚀 ابدأ بشراء أول لعبة لك الآن واكتشف أحدث العروض
              </p>
              <div className="w-12 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
