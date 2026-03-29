import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile, Notification, DeliveryStatus } from '../../types';
import { Package, Search, Filter, Loader2, User, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const ManageOrders: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users for orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateOrderStatus = async (userId: string, notificationId: string, newStatus: DeliveryStatus) => {
    try {
      const user = users.find(u => u.uid === userId);
      if (!user || !user.notifications) return;

      const updatedNotifications = user.notifications.map(n => 
        n.id === notificationId ? { ...n, deliveryStatus: newStatus } : n
      );

      await updateDoc(doc(db, 'users', userId), {
        notifications: updatedNotifications
      });

      // Update local state
      setUsers(prev => prev.map(u => 
        u.uid === userId ? { ...u, notifications: updatedNotifications } : u
      ));
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  const allOrders = users.flatMap(user => 
    (user.notifications || [])
      .filter(n => n.type === 'purchase')
      .map(n => ({ ...n, userEmail: user.email, userId: user.uid }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = 
      order.itemTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (order.deliveryStatus || 'Pending') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
            <ChevronRight className="text-white w-6 h-6 rotate-180" />
          </Link>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">إدارة الطلبات</h1>
            <p className="text-gray-500 text-sm font-medium">متابعة وتحديث حالة تسليم المشتريات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-3 relative">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث عن منتج أو مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-6 text-white focus:border-cyan-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-6 text-white focus:border-cyan-500 outline-none transition-all appearance-none"
          >
            <option value="all">كل الحالات</option>
            <option value="Pending">قيد الانتظار</option>
            <option value="Processing">جاري المعالجة</option>
            <option value="Delivered">تم التسليم</option>
            <option value="Ready for pickup">جاهز للاستلام</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold">لا توجد طلبات تطابق بحثك</p>
          </div>
        ) : (
          filteredOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shrink-0">
                      <Package className="text-cyan-400 w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{order.itemTitle}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          (order.deliveryStatus || 'Pending') === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                          (order.deliveryStatus || 'Pending') === 'Processing' ? 'bg-yellow-500/20 text-yellow-400' :
                          (order.deliveryStatus || 'Pending') === 'Ready for pickup' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {order.deliveryStatus || 'Pending'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{order.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-2">تحديث الحالة:</div>
                    <div className="flex gap-2">
                      {(['Pending', 'Processing', 'Delivered', 'Ready for pickup'] as DeliveryStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(order.userId, order.id, status)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            (order.deliveryStatus || 'Pending') === status
                              ? 'bg-cyan-500 border-cyan-500 text-black'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {status === 'Pending' ? 'انتظار' :
                           status === 'Processing' ? 'معالجة' :
                           status === 'Delivered' ? 'تم' : 'جاهز'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">تفاصيل التسليم</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">النوع:</span>
                        <span className="text-xs font-bold text-white">{order.deliveryType}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block mb-2">البيانات:</span>
                        <code className="block p-3 bg-white/5 rounded-lg text-sm font-mono text-cyan-400 break-all">
                          {order.deliveryDetails}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">تعليمات إضافية</h4>
                    <p className="text-sm text-gray-400 italic">
                      {order.deliveryInstructions || 'لا توجد تعليمات إضافية'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
