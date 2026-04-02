import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Store, Users, Plus, Settings, ChevronRight, MessageSquare, UserPlus, Gamepad, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import PredictiveAnalytics from '../../components/Admin/PredictiveAnalytics';

interface Activity {
  id: string;
  type: 'game' | 'product' | 'user';
  title: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    games: 0,
    products: 0,
    users: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gamesSnap = await getDocs(collection(db, 'games'));
        const productsSnap = await getDocs(collection(db, 'products'));
        const usersSnap = await getDocs(collection(db, 'users'));

        setStats({
          games: gamesSnap.size,
          products: productsSnap.size,
          users: usersSnap.size
        });

        // Fetch recent activities
        const gamesQ = query(collection(db, 'games'), orderBy('createdAt', 'desc'), limit(5));
        const productsQ = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(5));
        const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));

        const [gSnap, pSnap, uSnap] = await Promise.all([
          getDocs(gamesQ),
          getDocs(productsQ),
          getDocs(usersQ)
        ]);

        const activities: Activity[] = [
          ...gSnap.docs.map(doc => ({
            id: doc.id,
            type: 'game' as const,
            title: doc.data().title,
            createdAt: doc.data().createdAt
          })),
          ...pSnap.docs.map(doc => ({
            id: doc.id,
            type: 'product' as const,
            title: doc.data().title,
            createdAt: doc.data().createdAt
          })),
          ...uSnap.docs.map(doc => ({
            id: doc.id,
            type: 'user' as const,
            title: doc.data().displayName || doc.data().email || 'مستخدم جديد',
            createdAt: doc.data().createdAt
          }))
        ];

        setRecentActivities(activities.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 8));

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { title: 'إجمالي الألعاب', value: stats.games, icon: Gamepad2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { title: 'إجمالي المنتجات', value: stats.products, icon: Store, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { title: 'إجمالي المستخدمين', value: stats.users, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
          <LayoutDashboard className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic">لوحة التحكم</h1>
          <p className="text-gray-500 text-sm font-medium">إدارة مخزون المتجر والمستخدمين</p>
        </div>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="text-cyan-400 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase italic">التحليلات التنبؤية</h2>
        </div>
        <PredictiveAnalytics />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">إحصائيات مباشرة</span>
            </div>
            <div className="text-4xl font-black text-white mb-1">{loading ? '...' : stat.value}</div>
            <div className="text-gray-400 font-medium">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase italic">إجراءات سريعة</h2>
            <Settings className="w-5 h-5 text-gray-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/games"
              className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Plus className="text-cyan-400 w-5 h-5" />
                </div>
                <span className="font-bold">إدارة الألعاب</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
            <Link
              to="/admin/products"
              className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Plus className="text-purple-400 w-5 h-5" />
                </div>
                <span className="font-bold">إدارة المنتجات</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-green-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Plus className="text-green-400 w-5 h-5" />
                </div>
                <span className="font-bold">إدارة الطلبات</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
            <Link
              to="/admin/messages"
              className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-yellow-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-yellow-400 w-5 h-5" />
                </div>
                <span className="font-bold">إدارة الرسائل</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-2xl hover:border-cyan-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Users className="text-cyan-400 w-5 h-5" />
                </div>
                <span className="font-bold">إدارة المستخدمين</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:-translate-x-1 transition-transform rotate-180" />
            </Link>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase italic">النشاط الأخير</h2>
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">مباشر</div>
          </div>
          <div className="space-y-4">
            {recentActivities.length === 0 && !loading ? (
              <p className="text-gray-500 text-center py-8 italic">لا يوجد نشاط مؤخراً</p>
            ) : (
              recentActivities.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5 group hover:border-white/10 transition-all"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    activity.type === 'game' ? 'bg-cyan-500/10 text-cyan-400' :
                    activity.type === 'product' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-green-500/10 text-green-400'
                  )}>
                    {activity.type === 'game' ? <Gamepad className="w-5 h-5" /> :
                     activity.type === 'product' ? <ShoppingBag className="w-5 h-5" /> :
                     <UserPlus className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate text-right">
                      {activity.type === 'game' ? 'تمت إضافة لعبة: ' :
                       activity.type === 'product' ? 'تم تحديث منتج: ' :
                       'انضم مستخدم جديد: '}
                      <span className="text-gray-400 font-medium">{activity.title}</span>
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        {new Date(activity.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                      <Clock className="w-3 h-3 text-gray-700" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
