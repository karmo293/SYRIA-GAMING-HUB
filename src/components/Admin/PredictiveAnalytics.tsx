import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const PredictiveAnalytics: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    predictedNextMonthSales: 0,
    growthRate: 0,
    popularCategory: '',
    customerRetention: 0
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        analyzeData(ordersData);
      } catch (error) {
        console.error("Error fetching orders for analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const analyzeData = (data: Order[]) => {
    if (data.length === 0) return;

    // Group by month
    const monthlySales: { [key: string]: number } = {};
    data.forEach(order => {
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
      monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
    });

    const salesValues = Object.values(monthlySales);
    if (salesValues.length >= 2) {
      const lastMonth = salesValues[salesValues.length - 1];
      const prevMonth = salesValues[salesValues.length - 2];
      const growth = ((lastMonth - prevMonth) / prevMonth) * 100;
      
      // Simple linear projection for next month
      const prediction = lastMonth * (1 + (growth / 100));
      
      setStats({
        predictedNextMonthSales: Math.round(prediction),
        growthRate: Math.round(growth),
        popularCategory: 'Steam Keys', // This would normally be calculated from items
        customerRetention: 85 // Placeholder
      });
    }
  };

  const chartData = Object.entries(
    orders.reduce((acc: any, order) => {
      const month = new Date(order.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + order.totalAmount;
      return acc;
    }, {})
  ).map(([name, sales]) => ({ name, sales }));

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="text-cyan-400 w-6 h-6" />
            </div>
            {stats.growthRate > 0 ? (
              <div className="flex items-center gap-1 text-green-400 text-sm font-bold">
                <TrendingUp className="w-4 h-4" /> +{stats.growthRate}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-400 text-sm font-bold">
                <TrendingDown className="w-4 h-4" /> {stats.growthRate}%
              </div>
            )}
          </div>
          <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">توقع مبيعات الشهر القادم</h3>
          <p className="text-3xl font-black">${stats.predictedNextMonthSales}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <Users className="text-purple-400 w-6 h-6" />
            </div>
            <div className="text-purple-400 text-sm font-bold">مرتفع</div>
          </div>
          <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">نسبة احتفاظ العملاء</h3>
          <p className="text-3xl font-black">{stats.customerRetention}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="text-yellow-400 w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">الفئة الأكثر طلباً</h3>
          <p className="text-2xl font-black">{stats.popularCategory}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
              <Calendar className="text-green-400 w-6 h-6" />
            </div>
          </div>
          <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">إجمالي الطلبات</h3>
          <p className="text-3xl font-black">{orders.length}</p>
        </motion.div>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3">
          <TrendingUp className="text-cyan-400 w-6 h-6" /> تحليل اتجاه المبيعات
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#666" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0a0a0a', 
                  border: '1px solid #ffffff10',
                  borderRadius: '12px',
                  color: '#fff'
                }}
                itemStyle={{ color: '#06b6d4' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#06b6d4" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
