import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, Zap, Trophy, Star, Gift, Store, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const DailyMissions: React.FC = () => {
  const { user, userProfile, addXP } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  // Check if user dismissed it in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('daily-missions-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('daily-missions-dismissed', 'true');
  };

  const missions = [
    {
      id: 'daily-login',
      title: 'تسجيل الدخول اليومي',
      description: 'سجل دخولك اليوم للحصول على مكافأة',
      reward: 10,
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      completed: true, // This would normally be checked against user data
    },
    {
      id: 'buy-product',
      title: 'شراء أول منتج',
      description: 'قم بشراء أي منتج من المتجر',
      reward: 50,
      icon: <Star className="w-5 h-5 text-cyan-400" />,
      completed: userProfile?.ownedGames && userProfile.ownedGames.length > 0,
    },
    {
      id: 'invite-friend',
      title: 'دعوة صديق',
      description: 'شارك رابط الإحالة الخاص بك مع صديق',
      reward: 100,
      icon: <Gift className="w-5 h-5 text-purple-400" />,
      completed: false,
    },
    {
      id: 'wishlist-items',
      title: 'قائمة الأمنيات',
      description: 'أضف 3 منتجات إلى قائمة أمنياتك',
      reward: 25,
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      completed: (userProfile?.wishlist?.length || 0) >= 3,
    },
    {
      id: 'discord-join',
      title: 'انضم لمجتمعنا',
      description: 'انضم إلى سيرفر الديسكورد الخاص بنا',
      reward: 30,
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      completed: false,
    },
    {
      id: 'product-review',
      title: 'شارك رأيك',
      description: 'اكتب تقييماً لأحد المنتجات التي اشتريتها',
      reward: 40,
      icon: <Trophy className="w-5 h-5 text-orange-400" />,
      completed: false,
    },
    {
      id: 'explore-store',
      title: 'مستكشف المتجر',
      description: 'قم بزيارة 5 أقسام مختلفة في المتجر',
      reward: 20,
      icon: <Store className="w-5 h-5 text-pink-400" />,
      completed: false,
    }
  ];

  if (!user) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section 
          id="daily-missions" 
          initial={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="py-12 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
                  <Trophy className="text-orange-500 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">المهام اليومية</h2>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">أكمل المهام لزيادة الـ XP الخاص بك</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">مستواك الحالي</p>
                    <p className="text-lg font-black text-white italic tracking-tighter">LEVEL {userProfile?.level || 1}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">إجمالي الـ XP</p>
                    <p className="text-lg font-black text-cyan-400 italic tracking-tighter">{userProfile?.xp || 0} XP</p>
                  </div>
                </div>

                <button 
                  onClick={handleDismiss}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                  title="إخفاء المهام"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

        {/* Overall Progress */}
        <div className="mb-10 bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                <Target className="text-cyan-400 w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">تقدمك اليوم</p>
                <p className="text-sm font-bold text-white">{missions.filter(m => m.completed).length} من {missions.length} مهام مكتملة</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">المكافأة الإضافية</p>
              <p className="text-sm font-bold text-white">+{missions.length * 10} XP عند الإكمال</p>
            </div>
          </div>
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(missions.filter(m => m.completed).length / missions.length) * 100}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "group relative p-6 rounded-[2rem] border transition-all duration-500",
                mission.completed 
                  ? "bg-green-500/5 border-green-500/20" 
                  : "bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.07]"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                  mission.completed ? "bg-green-500/20" : "bg-white/5 group-hover:bg-cyan-500/20"
                )}>
                  {mission.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : mission.icon}
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    mission.completed ? "bg-green-500/20 text-green-400" : "bg-cyan-500/10 text-cyan-400"
                  )}>
                    +{mission.reward} XP
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-black text-white mb-1">{mission.title}</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">{mission.description}</p>

              <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: mission.completed ? '100%' : '0%' }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    mission.completed ? "bg-green-500" : "bg-cyan-500"
                  )}
                />
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                  {mission.completed ? 'مكتملة' : 'قيد التنفيذ'}
                </span>
                {!mission.completed && (
                  <button className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-white transition-colors">
                    انطلق الآن →
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* Weekly Bonus Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            viewport={{ once: true }}
            className="group relative p-6 rounded-[2rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <Gift className="w-8 h-8 text-cyan-400 opacity-20 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500 text-black">
                مكافأة أسبوعية
              </span>
            </div>

            <h3 className="text-lg font-black text-white mb-1">تحدي الأسبوع</h3>
            <p className="text-sm text-gray-400 font-medium mb-6">أكمل 20 مهمة يومية خلال هذا الأسبوع للحصول على صندوق عشوائي مجاني!</p>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[8px] font-bold">
                    {i}
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-black bg-cyan-500 flex items-center justify-center text-[8px] font-bold text-black">
                  +16
                </div>
              </div>
              <span className="text-xs font-black text-cyan-400">0/20</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )}
</AnimatePresence>
  );
};

export default DailyMissions;
