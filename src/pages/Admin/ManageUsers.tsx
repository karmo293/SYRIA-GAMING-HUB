import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Users, Search, DollarSign, Save, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../../types';
import { handleFirestoreError, OperationType } from '../../utils/errorHandlers';

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), limit(20));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('فشل تحميل المستخدمين.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) {
      fetchUsers();
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error searching users:", err);
      setError('فشل البحث عن المستخدم.');
    } finally {
      setLoading(false);
    }
  };

  const updateBalance = async (uid: string, newBalance: number) => {
    setUpdating(uid);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ targetUserId: uid, amount: newBalance })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشلت عملية التحديث');
      }

      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, walletBalance: newBalance } : u));
    } catch (err) {
      console.error("Error updating balance:", err);
      setError('فشل تحديث الرصيد.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
          <Users className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-4xl font-black uppercase italic">إدارة المستخدمين</h1>
          <p className="text-gray-500 text-sm font-medium">تعديل أرصدة المحفظة والأدوار</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="البحث عن طريق البريد الإلكتروني..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-cyan-500 outline-none transition-all text-right"
          />
        </div>
        <button
          type="submit"
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-8 rounded-xl font-bold uppercase tracking-wider transition-all"
        >
          بحث
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm mb-8 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-12 italic">لا يوجد مستخدمين لعرضهم</p>
        ) : (
          users.map((user, i) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Users className="text-cyan-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user.displayName || 'مستخدم بدون اسم'}</h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                  <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                  <input
                    type="number"
                    defaultValue={user.walletBalance || 0}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val !== user.walletBalance) {
                        updateBalance(user.uid, val);
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white focus:border-green-500 outline-none transition-all text-right"
                  />
                </div>
                <button
                  disabled={updating === user.uid}
                  className="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-all disabled:opacity-50"
                  title="حفظ الرصيد"
                >
                  {updating === user.uid ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
