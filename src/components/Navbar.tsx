import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, Gamepad2, Store, Bell } from 'lucide-react';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import CartDrawer from './CartDrawer';
import NotificationsDrawer from './NotificationsDrawer';

const Navbar: React.FC = () => {
  const { user, isAdmin, userProfile } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
                <span className="text-xl font-bold tracking-tighter text-white">SYRIA GAMING <span className="text-cyan-400">HUB</span></span>
              </Link>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline gap-4">
                  <Link to="/" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الرئيسية</Link>
                  <Link to="/games" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">الألعاب</Link>
                  <Link to="/store" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">المتجر</Link>
                  <Link to="/contact" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">تواصل معنا</Link>
                  {user && (
                    <>
                      <Link to="/profile" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">ملفي الشخصي</Link>
                      <Link to="/orders" className="text-gray-300 hover:text-cyan-400 px-3 py-2 rounded-md text-sm font-medium transition-colors">طلباتي</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
