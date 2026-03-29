import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Package, Key, User, ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const { user, userProfile } = useAuth();

  const markAsRead = async (notificationId: string) => {
    if (!user || !userProfile) return;
    
    const updatedNotifications = userProfile.notifications?.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );

    try {
      await setDoc(doc(db, 'users', user.uid), {
        notifications: updatedNotifications
      }, { merge: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const notifications = userProfile?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
                  <Bell className="text-cyan-400 w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">التنبيهات</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    لديك {unreadCount} تنبيهات غير مقروءة
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <Bell className="w-10 h-10 text-gray-500" />
                  </div>
                  <p className="text-gray-500 font-medium">لا توجد تنبيهات حالياً</p>
                </div>
              ) : (
                notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-2xl border transition-all ${
                      notification.read 
                        ? 'bg-white/5 border-white/5 opacity-70' 
                        : 'bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]'
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notification.type === 'purchase' ? 'bg-green-500/10 text-green-400' : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {notification.type === 'purchase' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-white text-sm line-clamp-1">{notification.title}</h4>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {new Date(notification.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">{notification.message}</p>

                        {notification.type === 'purchase' && notification.deliveryDetails && (
                          <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">تفاصيل التسليم</span>
                              <div className="flex gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  notification.deliveryStatus === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                                  notification.deliveryStatus === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                  notification.deliveryStatus === 'Ready for pickup' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-white/10 text-gray-400'
                                }`}>
                                  {notification.deliveryStatus || 'Pending'}
                                </span>
                                <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">
                                  {notification.deliveryType}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 group">
                              {notification.deliveryType === 'Steam Key' ? (
                                <Key className="w-4 h-4 text-cyan-400" />
                              ) : notification.deliveryType === 'Steam Account' ? (
                                <User className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <Package className="w-4 h-4 text-cyan-400" />
                              )}
                              <code className="text-sm font-mono text-white flex-1 break-all">
                                {notification.deliveryDetails}
                              </code>
                            </div>

                            {notification.deliveryInstructions && (
                              <div className="text-[10px] text-gray-500 leading-relaxed italic">
                                * {notification.deliveryInstructions}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5">
              <button
                onClick={onClose}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-black uppercase tracking-wider text-sm transition-all border border-white/10"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsDrawer;
