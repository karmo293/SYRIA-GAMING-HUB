import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ContactMessage } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Trash2, CheckCircle2, Clock, User, MessageSquare, ChevronRight, Search, Filter } from 'lucide-react';

const ManageMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'read' | 'replied'>('all');

  useEffect(() => {
    const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactMessage[];
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'new' | 'read' | 'replied') => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || msg.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">إدارة الرسائل</h1>
          <p className="text-gray-500">عرض وإدارة استفسارات العملاء ورسائل التواصل.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="بحث في الرسائل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-cyan-500 outline-none transition-all w-64 text-right"
            />
          </div>
          
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {(['all', 'new', 'read', 'replied'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  filterStatus === status ? 'bg-cyan-500 text-black' : 'text-gray-500 hover:text-white'
                }`}
              >
                {status === 'all' ? 'الكل' : status === 'new' ? 'جديد' : status === 'read' ? 'مقروء' : 'تم الرد'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMessages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white/5 border rounded-3xl p-8 relative overflow-hidden group transition-all ${
                msg.status === 'new' ? 'border-cyan-500/30' : 'border-white/10'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] -z-10" />
              
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      msg.status === 'new' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-gray-400'
                    }`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{msg.subject}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {msg.name}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {msg.email}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(msg.createdAt).toLocaleString('ar-EG')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl text-gray-300 leading-relaxed text-right">
                    {msg.message}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col justify-end gap-3 min-w-[160px]">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">الحالة</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusChange(msg.id!, 'read')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          msg.status === 'read' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        }`}
                      >
                        مقروء
                      </button>
                      <button
                        onClick={() => handleStatusChange(msg.id!, 'replied')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          msg.status === 'replied' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                        }`}
                      >
                        تم الرد
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(msg.id!)}
                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl text-xs font-black uppercase transition-all mt-auto"
                  >
                    <Trash2 className="w-4 h-4" /> حذف الرسالة
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMessages.length === 0 && (
          <div className="bg-white/5 border border-white/10 p-20 rounded-[40px] text-center">
            <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">لا توجد رسائل</h3>
            <p className="text-gray-500">لم يتم العثور على أي رسائل تطابق معايير البحث.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMessages;
