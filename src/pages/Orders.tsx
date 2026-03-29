import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Calendar, ShoppingBag, ChevronRight, Search, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Order[];
        
        // Sort locally to avoid index requirement
        setOrders(ordersData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
                <FileText className="text-cyan-400 w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">سجل المشتريات</span>
            </motion.div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">الفواتير والطلبات</h1>
          </div>

          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="بحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-white w-full md:w-80 focus:border-cyan-500 outline-none transition-all text-right"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest">جاري تحميل سجلاتك...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 mx-auto">
              <ShoppingBag className="text-gray-600 w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">لا توجد طلبات بعد</h3>
            <p className="text-gray-400 mb-8 max-w-xs mx-auto">لم تقم بأي عمليات شراء حتى الآن. ابدأ باستكشاف متجرنا!</p>
            <a
              href="/games"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-wider transition-all"
            >
              تصفح الألعاب
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-[#0a0a0a] border border-white/10 rounded-[2rem] overflow-hidden hover:border-cyan-500/50 transition-all shadow-xl"
              >
                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                        <ShoppingBag className="text-gray-400 w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">رقم الطلب:</span>
                          <span className="text-sm font-mono text-cyan-400">{order.id.slice(0, 8)}...</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-3xl font-black text-white italic mb-1">${order.totalAmount.toFixed(2)}</div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-500">مكتمل</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">المنتجات</div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 bg-black rounded-lg overflow-hidden border border-white/10">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-white leading-tight">{item.title}</h4>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.type === 'game' ? 'لعبة' : 'منتج رقمي'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-white">${item.price.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase">الكمية: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <span className="font-bold uppercase tracking-widest text-[10px]">طريقة الدفع:</span>
                      <span className="text-white font-medium">{order.paymentMethod}</span>
                    </div>
                    
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/10">
                      <Download className="w-4 h-4" />
                      تحميل الفاتورة (PDF)
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
