import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Gamepad2, Zap, ShieldCheck } from 'lucide-react';
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Zap className="w-3 h-3" /> عروض الموسم الجديد
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
            أفضل متجر <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">للمنتجات الرقمية</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-xl leading-relaxed">
            احصل على مفاتيح الألعاب، UC، ديسكورد نيترو والمزيد بأفضل الأسعار. تسليم فوري ودعم على مدار الساعة.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/store"
              className="group bg-cyan-500 hover:bg-cyan-600 text-black px-8 py-4 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
            >
              تصفح الآن <ChevronRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
            <div className="flex items-center gap-6 px-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <ShieldCheck className="w-5 h-5 text-cyan-500" /> دفع آمن
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Gamepad2 className="w-5 h-5 text-cyan-500" /> وصول فوري
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
