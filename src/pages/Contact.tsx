import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Info } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Contact: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: userProfile?.displayName || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        uid: user?.uid || null,
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setSuccess(true);
      setFormData({ ...formData, subject: '', message: '' });
    } catch (err) {
      console.error("Error sending message:", err);
      setError("حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest mb-6"
        >
          <MessageSquare className="w-3 h-3" /> تواصل معنا
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black uppercase italic mb-6"
        >
          نحن هنا <span className="text-cyan-500">للمساعدة</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-500 text-xl max-w-2xl mx-auto"
        >
          هل لديك استفسار؟ فريقنا متاح دائماً للإجابة على تساؤلاتك وتقديم الدعم الفني اللازم.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] -z-10" />
            <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Mail className="text-black w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-2">البريد الإلكتروني</h3>
            <p className="text-gray-400 font-medium">support@gamestore.com</p>
            <p className="text-gray-600 text-sm mt-2">نرد عادةً خلال 24 ساعة</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] -z-10" />
            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <Phone className="text-black w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-2">الهاتف</h3>
            <p className="text-gray-400 font-medium">+966 50 000 0000</p>
            <p className="text-gray-600 text-sm mt-2">متاح من 9 صباحاً إلى 9 مساءً</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[60px] -z-10" />
            <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <MapPin className="text-black w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase italic mb-2">المقر الرئيسي</h3>
            <p className="text-gray-400 font-medium">الرياض، المملكة العربية السعودية</p>
            <p className="text-gray-600 text-sm mt-2">حي الملقا، طريق الملك فهد</p>
          </motion.div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 p-10 rounded-[40px] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />
            
            {success ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black uppercase italic mb-4">تم إرسال رسالتك!</h2>
                <p className="text-gray-500 mb-10">شكراً لتواصلك معنا. سيقوم فريقنا بمراجعة رسالتك والرد عليك في أقرب وقت ممكن.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-wider hover:bg-cyan-500 transition-all"
                >
                  إرسال رسالة أخرى
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">الاسم الكامل</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none transition-all text-right"
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none transition-all text-right"
                      placeholder="example@mail.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">الموضوع</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none transition-all text-right"
                    placeholder="ما هو موضوع استفسارك؟"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 text-right">الرسالة</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none transition-all text-right resize-none"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                    <Info className="w-4 h-4" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all group shadow-[0_20px_40px_rgba(6,182,212,0.2)]"
                >
                  {sending ? 'جاري الإرسال...' : (
                    <>
                      إرسال الرسالة <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
