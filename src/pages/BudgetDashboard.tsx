import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  PieChart as PieChartIcon, 
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const BudgetDashboard = () => {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSpent: 0,
    monthlySpent: 0,
    lastMonthSpent: 0,
    averageOrder: 0,
    categoryData: [] as { name: string; value: number }[],
    monthlyHistory: [] as { month: string; amount: number }[]
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(fetchedOrders);
        calculateStats(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const calculateStats = (data: Order[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let total = 0;
    let monthly = 0;
    let lastMonth = 0;
    const categories: Record<string, number> = {};
    const history: Record<string, number> = {};

    data.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const amount = order.totalAmount;
      total += amount;

      // Monthly stats
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        monthly += amount;
      } else if (orderDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1)) {
        lastMonth += amount;
      }

      // History for chart
      const monthYear = orderDate.toLocaleString('default', { month: 'short' });
      history[monthYear] = (history[monthYear] || 0) + amount;

      // Category stats
      order.items.forEach(item => {
        const cat = item.type === 'game' ? 'Games' : 'Products';
        categories[cat] = (categories[cat] || 0) + (item.price * item.quantity);
      });
    });

    const monthlyHistory = Object.entries(history)
      .map(([month, amount]) => ({ month, amount }))
      .reverse()
      .slice(0, 6);

    const categoryData = Object.entries(categories).map(([name, value]) => ({ name, value }));

    setStats({
      totalSpent: total,
      monthlySpent: monthly,
      lastMonthSpent: lastMonth,
      averageOrder: data.length > 0 ? total / data.length : 0,
      categoryData,
      monthlyHistory
    });
  };

  const COLORS = ['#F27D26', '#141414', '#8E9299', '#E4E3E0'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27D26]"></div>
      </div>
    );
  }

  const monthlyChange = stats.lastMonthSpent > 0 
    ? ((stats.monthlySpent - stats.lastMonthSpent) / stats.lastMonthSpent) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-[#E4E3E0] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/profile" className="flex items-center text-sm text-gray-600 hover:text-[#F27D26] mb-2 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Profile
            </Link>
            <h1 className="text-4xl font-bold text-[#141414] tracking-tight">Budget Dashboard</h1>
            <p className="text-gray-600 italic font-serif">Track your gaming investments and spending habits.</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Wallet Balance</p>
              <p className="text-2xl font-bold text-[#F27D26]">${userProfile?.walletBalance?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-[#F27D26]" />
              </div>
              {monthlyChange !== 0 && (
                <div className={`flex items-center text-sm font-medium ${monthlyChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {monthlyChange > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(monthlyChange).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">Monthly Spending</p>
            <h3 className="text-2xl font-bold text-[#141414]">${stats.monthlySpent.toFixed(2)}</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <h3 className="text-2xl font-bold text-[#141414]">{orders.length}</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Average Order Value</p>
            <h3 className="text-2xl font-bold text-[#141414]">${stats.averageOrder.toFixed(2)}</h3>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Lifetime Spend</p>
            <h3 className="text-2xl font-bold text-[#141414]">${stats.totalSpent.toFixed(2)}</h3>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Spending History */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#141414] flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#F27D26]" />
                Spending History
              </h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8E9299', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E9299', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8f8f8' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" fill="#F27D26" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-[#141414] mb-8 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-[#F27D26]" />
              Category Split
            </h3>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-gray-400 uppercase font-bold">Total</p>
                <p className="text-xl font-bold text-[#141414]">${stats.totalSpent.toFixed(0)}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {stats.categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#141414]">${entry.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <div className="p-8 border-bottom border-gray-100">
            <h3 className="text-xl font-bold text-[#141414]">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 font-bold">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Order ID</th>
                  <th className="px-8 py-4">Items</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 text-sm font-mono text-gray-400">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-600">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-[#141414]">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Link to={`/order-success/${order.id}`} className="text-[#F27D26] hover:underline text-sm font-medium flex items-center justify-end">
                        Details <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BudgetDashboard;
