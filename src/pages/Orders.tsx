import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Calendar, ShoppingBag, ChevronRight, Search, Filter, Loader2, Package, ShieldCheck, Clock, RefreshCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import WarrantyChecker from '../components/WarrantyChecker';

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const deliverySteps = [
    { id: 'Pending', label: 'قيد الانتظار', icon: <Clock className="w-4 h-4" /> },
    { id: 'Processing', label: 'جاري المعالجة', icon: <RefreshCcw className="w-4 h-4" /> },
    { id: 'Ready for pickup', label: 'جاهز للاستلام', icon: <Package className="w-4 h-4" /> },
    { id: 'Delivered', label: 'تم التسليم', icon: <CheckCircle2 className="w-4 h-4" /> }
  ];

  const getStatusIndex = (status: string) => {
    return deliverySteps.findIndex(step => step.id === status);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')) return;
    
    setCancellingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled'
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("حدث خطأ أثناء إلغاء الطلب");
    } finally {
      setCancellingId(null);
    }
  };

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
            <h1 className="text-4xl font-black uppercase italic text-white">الفواتير والطلبات</h1>
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
            <h3 className="text-2xl font-black uppercase italic mb-4">لا توجد طلبات بعد</h3>
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
                        <span className={`w-2 h-2 rounded-full ${
                          order.status === 'completed' ? 'bg-green-500' :
                          order.status === 'pending' ? 'bg-yellow-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          order.status === 'refunded' ? 'bg-purple-500' :
                          'bg-gray-500'
                        }`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'completed' ? 'text-green-500' :
                          order.status === 'pending' ? 'text-yellow-500' :
                          order.status === 'cancelled' ? 'text-red-500' :
                          order.status === 'refunded' ? 'text-purple-500' :
                          'text-gray-500'
                        }`}>
                          {order.status === 'completed' ? 'مكتمل' :
                           order.status === 'pending' ? 'قيد الانتظار' :
                           order.status === 'cancelled' ? 'ملغي' :
                           order.status === 'refunded' ? 'مسترد' : order.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.deliveryStatus && order.status !== 'cancelled' && order.status !== 'refunded' && (
                    <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                            <Package className="text-cyan-400 w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-0.5">تتبع الطلب</div>
                            <div className="text-sm font-bold text-white">رقم التتبع: {order.id.substring(0, 12)}</div>
                          </div>
                        </div>
                        <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                          {deliverySteps.find(s => s.id === order.deliveryStatus)?.label || order.deliveryStatus}
                        </div>
                      </div>

                      {/* Delivery Stepper */}
                      <div className="relative flex justify-between items-center px-4">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
                        <div 
                          className="absolute top-1/2 left-0 h-0.5 bg-cyan-500 -translate-y-1/2 z-0 transition-all duration-1000" 
                          style={{ width: `${(getStatusIndex(order.deliveryStatus) / (deliverySteps.length - 1)) * 100}%` }}
                        />
                        
                        {deliverySteps.map((step, idx) => {
                          const currentIdx = getStatusIndex(order.deliveryStatus);
                          const isActive = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                isCurrent ? 'bg-cyan-500 border-cyan-400 text-black scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)]' :
                                isActive ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' :
                                'bg-[#0a0a0a] border-white/10 text-gray-600'
                              }`}>
                                {step.icon}
                              </div>
                              <span className={`absolute -bottom-6 text-[9px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors duration-500 ${
                                isActive ? 'text-white' : 'text-gray-600'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {order.deliveryDetails && (
                        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div className="flex-1 w-full">
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">بيانات التسليم والوصول</div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs text-cyan-400 break-all relative group">
                              {order.deliveryDetails}
                              <button 
                                onClick={() => navigator.clipboard.writeText(order.deliveryDetails!)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="shrink-0">
                            <WarrantyChecker 
                              orderId={order.id} 
                              deliveryDetails={order.deliveryDetails} 
                              existingLogs={order.warrantyLog}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span className="font-bold uppercase tracking-widest text-[10px]">طريقة الدفع:</span>
                        <span className="text-white font-medium">{order.paymentMethod}</span>
                      </div>
                      
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {cancellingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          إلغاء الطلب
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        const btn = document.activeElement as HTMLButtonElement;
                        if (btn) {
                          const originalText = btn.innerHTML;
                          btn.disabled = true;
                          btn.innerHTML = `<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> جاري التحميل...`;
                          
                          setTimeout(() => {
                            btn.innerHTML = `<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> تم التحميل`;
                            btn.classList.remove('bg-cyan-500', 'hover:bg-cyan-600', 'text-black');
                            btn.classList.add('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                            
                            setTimeout(() => {
                              btn.disabled = false;
                              btn.innerHTML = originalText;
                              btn.classList.remove('bg-green-500/20', 'text-green-400', 'border-green-500/30');
                              btn.classList.add('bg-cyan-500', 'hover:bg-cyan-600', 'text-black');
                            }, 2000);
                          }, 1500);
                        }
                      }}
                      className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-3 rounded-xl font-black text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                    >
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
