import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Game } from '../types';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Gamepad2, ChevronRight, ShoppingBag, Package, Key, User as UserIcon, CheckCircle2, Info, Heart, Settings, Save, Copy, CreditCard, Sparkles, AlertCircle, Clock, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import SteamIntegration from '../components/SteamIntegration';
import WalletManager from '../components/WalletManager';

const Profile: React.FC = () => {
  const { user, userProfile, loading: authLoading, updateDisplayName } = useAuth();
  const [ownedGames, setOwnedGames] = useState<Game[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState(userProfile?.displayName || '');
  const [updatingName, setUpdatingName] = useState(false);

  const deliverySteps = [
    { id: 'Pending', label: 'انتظار', icon: <Clock className="w-3 h-3" /> },
    { id: 'Processing', label: 'معالجة', icon: <RefreshCcw className="w-3 h-3" /> },
    { id: 'Ready for pickup', label: 'جاهز', icon: <Package className="w-3 h-3" /> },
    { id: 'Delivered', label: 'تم', icon: <CheckCircle2 className="w-3 h-3" /> }
  ];

  const getStatusIndex = (status: string) => {
    return deliverySteps.findIndex(step => step.id === status);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch owned games
        if (userProfile?.ownedGames && userProfile.ownedGames.length > 0) {
          const games: Game[] = [];
          for (const gameId of userProfile.ownedGames) {
            const gameSnap = await getDoc(doc(db, 'games', gameId));
            if (gameSnap.exists()) {
              games.push({ id: gameSnap.id, ...gameSnap.data() } as Game);
            }
          }
          setOwnedGames(games);
        }

        // Fetch wishlist items
        if (userProfile?.wishlist && userProfile.wishlist.length > 0) {
          const items: any[] = [];
          for (const itemId of userProfile.wishlist) {
            // Try games first
            const gameSnap = await getDoc(doc(db, 'games', itemId));
            if (gameSnap.exists()) {
              items.push({ id: gameSnap.id, ...gameSnap.data(), type: 'game' });
            } else {
              // Try products
              const productSnap = await getDoc(doc(db, 'products', itemId));
              if (productSnap.exists()) {
                items.push({ id: productSnap.id, ...productSnap.data(), type: 'product' });
              }
            }
          }
          setWishlistItems(items);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchData();
    }
  }, [userProfile, authLoading]);

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === userProfile?.displayName) return;
    setUpdatingName(true);
    try {
      await updateDisplayName(newName.trim());
    } finally {
      setUpdatingName(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] px-4 text-center">
        <User className="w-16 h-16 text-gray-700 mb-6" />
        <h2 className="text-3xl font-black uppercase italic mb-4">يرجى تسجيل الدخول</h2>
        <p className="text-gray-500 mb-8 max-w-md">يجب عليك تسجيل الدخول لعرض ملفك الشخصي وألعابك المملوكة.</p>
        <Link to="/login" className="bg-cyan-500 text-black px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-cyan-600 transition-all">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const notifications = userProfile?.notifications || [];
  const purchaseNotifications = notifications
    .filter(n => n.type === 'purchase')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -z-10" />
          
          <div className="w-32 h-32 bg-cyan-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <User className="text-black w-16 h-16" />
          </div>
          
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-4xl font-black uppercase italic mb-2">
              {userProfile?.displayName || 'الملف الشخصي'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                {userProfile?.points || 0} نقطة
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-400" />
                ${userProfile?.walletBalance || 0} رصيد المحفظة
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-center">
            <div className="text-3xl font-black text-cyan-400 mb-1">{ownedGames.length}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-500">لعبة مملوكة</div>
          </div>
        </div>
      </motion.div>

      <section className="mb-20">
        <WalletManager />
      </section>

      <section className="mb-20">
        <SteamIntegration />
      </section>

      <section>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <Gamepad2 className="text-cyan-400 w-6 h-6" />
            </div>
            <h2 className="text-3xl font-black uppercase italic">ألعابي المملوكة</h2>
          </div>
        </div>

        {ownedGames.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center">
            <ShoppingBag className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">لا توجد ألعاب بعد</h3>
            <p className="text-gray-500 mb-8">لم تقم بشراء أي ألعاب من المنصة حتى الآن.</p>
            <Link to="/games" className="inline-flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
              تصفح الألعاب الآن <ChevronRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ownedGames.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/50 transition-all shadow-xl"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={game.imageUrl}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black uppercase italic mb-4">{game.title}</h3>
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/game/${game.id}`}
                      className="bg-white/10 hover:bg-cyan-500 hover:text-black text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      عرض التفاصيل
                    </Link>
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full">
                      مملوكة
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
            <Package className="text-purple-400 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black uppercase italic">سجل المشتريات</h2>
        </div>

        {purchaseNotifications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center">
            <Package className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">لا توجد مشتريات بعد</h3>
            <p className="text-gray-500">ستظهر هنا تفاصيل مشترياتك وحالة التسليم الخاصة بها.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {purchaseNotifications.map((notification, i) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] -z-10" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-start gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      notification.deliveryStatus === 'Delivered' ? 'bg-green-500/10 text-green-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {notification.deliveryStatus === 'Delivered' ? <CheckCircle2 className="w-7 h-7" /> : <Package className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-white italic uppercase">{notification.itemTitle}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          notification.deliveryStatus === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                          notification.deliveryStatus === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' :
                          notification.deliveryStatus === 'Ready for pickup' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {deliverySteps.find(s => s.id === notification.deliveryStatus)?.label || notification.deliveryStatus || 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">
                        تم الشراء في {new Date(notification.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                      
                      {/* Delivery Stepper Mini */}
                      <div className="mt-4 flex items-center gap-1 max-w-[200px]">
                        {deliverySteps.map((step, idx) => {
                          const currentIdx = getStatusIndex(notification.deliveryStatus || 'Pending');
                          const isActive = idx <= currentIdx;
                          return (
                            <React.Fragment key={step.id}>
                              <div 
                                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                                  isActive ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-600'
                                }`}
                                title={step.label}
                              >
                                {step.icon}
                              </div>
                              {idx < deliverySteps.length - 1 && (
                                <div className={`h-0.5 w-4 rounded-full ${isActive && idx < currentIdx ? 'bg-cyan-500' : 'bg-white/10'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-4">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl min-w-[240px]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">تفاصيل التسليم</span>
                        <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">
                          {notification.deliveryType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 relative group/code">
                        {notification.deliveryType === 'Steam Key' ? (
                          <Key className="w-4 h-4 text-cyan-400" />
                        ) : notification.deliveryType === 'Steam Account' ? (
                          <UserIcon className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Package className="w-4 h-4 text-cyan-400" />
                        )}
                        <code className="text-sm font-mono text-white flex-1 break-all">
                          {notification.deliveryDetails}
                        </code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(notification.deliveryDetails || '');
                            // In a real app, show a toast notification here
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover/code:opacity-100"
                          title="نسخ الكود"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        {notification.deliveryInstructions && (
                          <p className="text-[10px] text-gray-600 italic leading-relaxed">
                            * {notification.deliveryInstructions}
                          </p>
                        )}
                        <button className="text-[10px] text-red-400 hover:underline flex items-center gap-1 ml-auto">
                          <AlertCircle className="w-3 h-3" />
                          تبليغ عن كود معطل
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
            <Sparkles className="text-yellow-400 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black uppercase italic">برنامج الإحالة</h2>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -z-10" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-2xl font-black text-white italic uppercase mb-4">ادعُ أصدقاءك واربح نقاطاً!</h3>
              <p className="text-gray-400 leading-relaxed mb-6">
                شارك كود الإحالة الخاص بك مع أصدقائك. عندما يقومون بأول عملية شراء، ستحصل على 500 نقطة وهم سيحصلون على خصم 10%.
              </p>
              <div className="flex items-center gap-4">
                <div className="bg-black/40 border border-white/10 px-6 py-3 rounded-2xl font-mono text-xl text-yellow-400 tracking-widest">
                  {userProfile?.referralCode || 'GENERATING...'}
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(userProfile?.referralCode || '');
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 py-3 rounded-2xl transition-all flex items-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  نسخ الكود
                </button>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-5xl font-black text-white italic mb-2">
                {userProfile?.referralPoints || 0}
              </div>
              <div className="text-sm font-bold text-yellow-400 uppercase tracking-widest">نقطة مكتسبة من الإحالات</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Heart className="text-red-400 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black uppercase italic">قائمة الأمنيات</h2>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center">
            <Heart className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">قائمة الأمنيات فارغة</h3>
            <p className="text-gray-500 mb-8">أضف بعض الألعاب أو المنتجات التي تهمك لمتابعتها لاحقاً.</p>
            <Link to="/games" className="inline-flex items-center gap-2 text-red-400 font-bold hover:text-red-300 transition-colors">
              استكشف الألعاب <ChevronRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-red-500/30 transition-all"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <Link to={`/${item.type}/${item.id}`} className="w-full bg-white text-black py-2 rounded-lg text-xs font-black uppercase text-center">
                      عرض المنتج
                    </Link>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm truncate mb-1">{item.title}</h3>
                  <p className="text-red-400 font-black text-lg">${item.ourPrice || item.price}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 bg-gray-500/10 rounded-xl flex items-center justify-center">
            <Settings className="text-gray-400 w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black uppercase italic">إعدادات الحساب</h2>
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">الاسم المستعار</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="أدخل اسمك الجديد"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all text-right"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={updatingName || !newName.trim() || newName === userProfile?.displayName}
                  className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black px-6 py-3 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  {updatingName ? 'جاري الحفظ...' : <><Save className="w-4 h-4" /> حفظ</>}
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-xs text-gray-600 text-right leading-relaxed">
                * يمكنك تغيير اسمك المستعار الذي يظهر في التقييمات والملف الشخصي.
                <br />
                * البريد الإلكتروني مرتبط بحسابك ولا يمكن تغييره حالياً.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
