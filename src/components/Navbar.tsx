import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, Gamepad2, Store, Bell, Sparkles, Trophy, ChevronDown, MessageSquare, Package, HelpCircle, Bot, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import CartDrawer from './CartDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import GamerWallet from './GamerWallet';

const Navbar: React.FC = () => {
  const { user, isAdmin, userProfile } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const unreadNotificationsCount = userProfile?.notifications?.filter(n => !n.read).length || 0;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] group-hover:scale-110 transition-transform">
                  <Gamepad2 className="text-black w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-white">SYRIA GAMING <span className="text-cyan-400">HUB</span></span>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline gap-4">
                  <Link to="/" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الرئيسية</Link>
                  <Link to="/games" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الألعاب</Link>
                  <Link to="/store" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">المتجر</Link>
                  
                  {user && (
                    <div className="relative">
                      <button 
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        ملفي الشخصي
                        <ChevronDown className={cn("w-4 h-4 transition-transform", isProfileDropdownOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isProfileDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsProfileDropdownOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-[40px] -z-10" />
                              
                              <div className="px-4 py-3 mb-2 border-b border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">أهلاً بك</p>
                                <p className="text-xs font-bold text-white truncate">{userProfile?.displayName || user?.email}</p>
                              </div>
                              
                              <div className="space-y-1">
                                <p className="px-4 py-1 text-[9px] font-black text-gray-600 uppercase tracking-widest">👤 الحساب</p>
                                <Link 
                                  to="/profile" 
                                  onClick={() => setIsProfileDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                    <User className="w-4 h-4 text-cyan-400" />
                                  </div>
                                  ملفي الشخصي
                                </Link>

                                <Link 
                                  to="/orders" 
                                  onClick={() => setIsProfileDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                    <Package className="w-4 h-4 text-blue-400" />
                                  </div>
                                  طلباتي
                                </Link>
                              </div>

                              <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                <p className="px-4 py-1 text-[9px] font-black text-gray-600 uppercase tracking-widest">🎮 النظام</p>
                                <Link 
                                  to="/lootbox" 
                                  onClick={() => setIsProfileDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group relative overflow-hidden"
                                >
                                  <div className="absolute inset-0 bg-yellow-500/5 animate-pulse" />
                                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                  </div>
                                  صندوق الحظ
                                </Link>

                                <Link 
                                  to="/quests" 
                                  onClick={() => setIsProfileDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                    <Trophy className="w-4 h-4 text-cyan-400" />
                                  </div>
                                  المهام والجوائز
                                </Link>

                                <Link 
                                  to="/ai-stylist" 
                                  onClick={() => setIsProfileDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                                    <Bot className="w-4 h-4 text-purple-400" />
                                  </div>
                                  المساعد الذكي
                                </Link>
                              </div>

                              <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                <p className="px-4 py-1 text-[9px] font-black text-gray-600 uppercase tracking-widest">⚙️ أخرى</p>
                                <Link 
                                  to="/contact" 
                                  onClick={() => setIsProfileDropdownOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center group-hover:bg-gray-500/20 transition-colors">
                                    <MessageSquare className="w-4 h-4 text-gray-400" />
                                  </div>
                                  تواصل معنا
                                </Link>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && <div className="hidden lg:block"><GamerWallet /></div>}
              {user && (
                <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="p-2 text-gray-300 hover:text-cyan-400 transition-colors relative" 
                  title="التنبيهات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-gray-300 hover:text-cyan-400 transition-colors relative" 
                title="سلة التسوق"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>
              {isAdmin && (
                <Link to="/admin" className="p-2 text-gray-300 hover:text-cyan-400 transition-colors" title="لوحة التحكم">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-4">
                  <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-red-400 transition-colors" title="تسجيل الخروج">
                    <LogOut className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
              ) : (
                <Link to="/login" className="bg-cyan-500 hover:bg-cyan-600 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  دخول
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <NotificationsDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
};

export default Navbar;
