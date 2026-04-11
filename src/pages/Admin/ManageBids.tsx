import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gavel, CheckCircle2, XCircle, MessageSquare, Search, Filter, Loader2, DollarSign, User, Calendar } from 'lucide-react';
import { collection, query, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Bid } from '../../types';
import { cn } from '../../lib/utils';

const ManageBids: React.FC = () => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'bids'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bidsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bid[];
      setBids(bidsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRespond = async (bidId: string, status: 'accepted' | 'rejected', response?: string) => {
    setProcessingId(bidId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/bids/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ bidId, status, response: response || '' })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشلت عملية الرد');
      }
    } catch (error) {
      console.error("Error updating bid:", error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء الرد على المزايدة');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch = 
      bid.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bid.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">إدارة المزايدات</h2>
          <p className="text-gray-500 text-sm font-medium">مراجعة والرد على عروض الأسعار المقدمة من المستخدمين</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="بحث عن منتج أو مستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white text-sm focus:border-yellow-500 outline-none transition-all w-full sm:w-64 text-right"
            />
          </div>

          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white text-sm focus:border-yellow-500 outline-none transition-all appearance-none w-full sm:w-48 text-right"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد الانتظار</option>
              <option value="accepted">تم القبول</option>
              <option value="rejected">تم الرفض</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredBids.length > 0 ? (
          filteredBids.map((bid) => (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-yellow-500/30 transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/30 group-hover:scale-110 transition-transform">
                    <Gavel className="text-yellow-500 w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic mb-1">{bid.itemTitle}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3" /> {bid.userEmail}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {new Date(bid.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px]",
                        bid.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                        bid.status === 'accepted' ? "bg-green-500/10 text-green-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {bid.status === 'pending' ? 'قيد الانتظار' : 
                         bid.status === 'accepted' ? 'تم القبول' : 'تم الرفض'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center sm:text-right">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">السعر المقترح</span>
                    <span className="text-2xl font-black text-yellow-500 italic">${bid.bidPrice}</span>
                  </div>

                  {bid.status === 'pending' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRespond(bid.id, 'rejected')}
                        disabled={processingId === bid.id}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20"
                        title="رفض العرض"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleRespond(bid.id, 'accepted')}
                        disabled={processingId === bid.id}
                        className="p-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl transition-all border border-green-500/20"
                        title="قبول العرض"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {bid.adminResponse && (
                <div className="mt-6 pt-6 border-t border-white/5 flex items-start gap-3">
                  <MessageSquare className="text-gray-500 w-4 h-4 mt-1" />
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">رد الإدارة</span>
                    <p className="text-sm text-gray-400 italic">{bid.adminResponse}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <Gavel className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest">لا توجد مزايدات مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBids;
