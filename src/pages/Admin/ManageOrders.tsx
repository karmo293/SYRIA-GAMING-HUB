import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order, Notification, DeliveryStatus } from '../../types';
import { Package, Search, Filter, Loader2, User, Calendar, ChevronRight, XCircle, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';

const ManageOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      setOrders(ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching orders:", error);
      handleFirestoreError(error, OperationType.GET, 'orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const sendNotification = async (userId: string, title: string, message: string) => {
    const notification: Notification = {
      id: Math.random().toString(36).substring(2, 15),
      userId,
      title,
      message,
      type: 'system',
      createdAt: new Date().toISOString(),
      read: false
    };

    try {
      await updateDoc(doc(db, 'users', userId), {
        notifications: arrayUnion(notification)
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus
      });

      // Send notification to user
      let title = "";
      let message = "";
      if (newStatus === 'cancelled') {
        title = "تم إلغاء طلبك";
        message = `تم إلغاء طلبك رقم ${orderId.substring(0, 8)} بنجاح.`;
      } else if (newStatus === 'refunded') {
        title = "تم استرداد المبلغ";
        message = `تم استرداد مبلغ طلبك رقم ${orderId.substring(0, 8)} بنجاح.`;
      } else if (newStatus === 'completed') {
        title = "اكتمل طلبك";
        message = `تم وضع علامة "مكتمل" على طلبك رقم ${orderId.substring(0, 8)}.`;
      }

      if (title) {
        await sendNotification(order.userId, title, message);
      }

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  const updateDeliveryStatus = async (orderId: string, newStatus: DeliveryStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await updateDoc(doc(db, 'orders', orderId), {
        deliveryStatus: newStatus
      });

      // Send notification to user
      const title = "تحديث حالة التسليم";
      const message = `تم تحديث حالة تسليم طلبك رقم ${orderId.substring(0, 8)} إلى: ${newStatus}`;
      await sendNotification(order.userId, title, message);

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, deliveryStatus: newStatus } : o
      ));
    } catch (error) {
      console.error("Error updating delivery status:", error);
      alert("حدث خطأ أثناء تحديث حالة التسليم");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDelivery = deliveryFilter === 'all' || (order.deliveryStatus || 'Pending') === deliveryFilter;

    return matchesSearch && matchesStatus && matchesDelivery;
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
            <h1 className="text-4xl font-black uppercase italic">إدارة الطلبات</h1>
            <p className="text-gray-500 text-sm font-medium">متابعة المبيعات، الإلغاءات، وعمليات الاسترداد</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-12">
        <div className="lg:col-span-3 relative">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث عن طلب، مستخدم، أو منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-14 pl-6 text-white focus:border-cyan-500 outline-none transition-all"
          />
        </div>
        <div className="lg:col-span-1 relative">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-10 pl-4 text-white text-xs font-bold focus:border-cyan-500 outline-none transition-all appearance-none"
          >
            <option value="all">حالة الطلب</option>
            <option value="completed">مكتمل</option>
            <option value="pending">قيد الانتظار</option>
            <option value="cancelled">ملغي</option>
            <option value="refunded">مسترد</option>
          </select>
        </div>
        <div className="lg:col-span-2 relative">
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-10 pl-4 text-white text-xs font-bold focus:border-cyan-500 outline-none transition-all appearance-none"
          >
            <option value="all">حالة التسليم</option>
            <option value="Pending">انتظار التسليم</option>
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shrink-0">
                      <Package className="text-cyan-400 w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-black text-white italic uppercase">طلب #{order.id.substring(0, 8)}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          order.status === 'refunded' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-white/10 text-gray-400'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' :
                           order.status === 'pending' ? 'قيد الانتظار' :
                           order.status === 'cancelled' ? 'ملغي' :
                           order.status === 'refunded' ? 'مسترد' : order.status}
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
                        <div className="text-cyan-400 font-black">${order.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.status !== 'cancelled' && order.status !== 'refunded' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          إلغاء الطلب
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'refunded')}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-bold transition-all"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          استرداد المبلغ
                        </button>
                      </>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تحديد كمكتمل
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">المنتجات</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <div className="text-sm font-bold text-white">{item.title}</div>
                              <div className="text-[10px] text-gray-500 uppercase">{item.type}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-white">${item.price.toFixed(2)}</div>
                            <div className="text-[10px] text-gray-500">الكمية: {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">حالة التسليم</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['Pending', 'Processing', 'Delivered', 'Ready for pickup'] as DeliveryStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateDeliveryStatus(order.id, status)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
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

                    <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-4">بيانات التسليم</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">النوع:</span>
                          <span className="text-xs font-bold text-white">{order.deliveryType || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-2">البيانات:</span>
                          <code className="block p-3 bg-white/5 rounded-lg text-xs font-mono text-cyan-400 break-all">
                            {order.deliveryDetails || 'لا توجد بيانات'}
                          </code>
                        </div>
                        {order.deliveryInstructions && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-2">تعليمات:</span>
                            <p className="text-xs text-gray-400 italic">{order.deliveryInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
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
