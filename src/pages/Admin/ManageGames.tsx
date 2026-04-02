import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Game, DeliveryType } from '../../types';
import { Plus, Trash2, Edit2, X, Save, Gamepad2, Image as ImageIcon, Link as LinkIcon, DollarSign, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const ManageGames: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    steamUrl: '',
    ourPrice: 0,
    steamPrice: 0,
    deliveryType: 'Steam Key' as DeliveryType,
    deliveryDetails: '',
    deliveryInstructions: '',
    stock: 0
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setError(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
  };

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setGames(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'games');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const dataToSave = {
        ...formData,
        ourPrice: Number(formData.ourPrice),
        steamPrice: Number(formData.steamPrice),
        stock: Number(formData.stock)
      };

      if (editingId) {
        await updateDoc(doc(db, 'games', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'games'), {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
      }
      setFormData({ 
        title: '', 
        description: '', 
        imageUrl: '', 
        steamUrl: '', 
        ourPrice: 0, 
        steamPrice: 0,
        deliveryType: 'Steam Key',
        deliveryDetails: '',
        deliveryInstructions: '',
        stock: 0
      });
      setIsAdding(false);
      setEditingId(null);
      fetchGames();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'games');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Custom confirm logic could go here, for now we just proceed or use a simpler check
    try {
      await deleteDoc(doc(db, 'games', id));
      fetchGames();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `games/${id}`);
    }
  };

  const startEdit = (game: Game) => {
    setFormData({
      title: game.title,
      description: game.description,
      imageUrl: game.imageUrl,
      steamUrl: game.steamUrl,
      ourPrice: game.ourPrice,
      steamPrice: game.steamPrice,
      deliveryType: game.deliveryType || 'Steam Key',
      deliveryDetails: game.deliveryDetails || '',
      deliveryInstructions: game.deliveryInstructions || '',
      stock: game.stock || 0
    });
    setEditingId(game.id);
    setIsAdding(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
            <Gamepad2 className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic">إدارة الألعاب</h1>
            <p className="text-gray-500 text-sm font-medium">إضافة، تعديل، أو حذف الألعاب من المكتبة</p>
          </div>
        </div>
        <button
          onClick={() => { 
            setIsAdding(true); 
            setEditingId(null); 
            setFormData({ 
              title: '', 
              description: '', 
              imageUrl: '', 
              steamUrl: '', 
              ourPrice: 0, 
              steamPrice: 0,
              deliveryType: 'Steam Key',
              deliveryDetails: '',
              deliveryInstructions: '',
              stock: 0
            }); 
          }}
          className="bg-cyan-500 hover:bg-cyan-600 text-black px-6 py-3 rounded-xl font-black uppercase tracking-wider flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" /> إضافة لعبة جديدة
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <div className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase italic">
                  {editingId ? 'تعديل اللعبة' : 'إضافة لعبة جديدة'}
                </h2>
                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">عنوان اللعبة</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none text-right"
                      placeholder="مثال: Elden Ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">رابط الصورة</label>
                    <div className="relative">
                      <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="url"
                        required
                        value={formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:border-cyan-500 outline-none text-right"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">الوصف</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none resize-none text-right"
                    placeholder="تفاصيل اللعبة، المميزات، إلخ."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">رابط متجر Steam</label>
                  <div className="relative">
                    <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="url"
                      required
                      value={formData.steamUrl}
                      onChange={e => setFormData({ ...formData, steamUrl: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:border-cyan-500 outline-none text-right"
                      placeholder="https://store.steampowered.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">سعرنا ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.ourPrice}
                        onChange={e => setFormData({ ...formData, ourPrice: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:border-cyan-500 outline-none text-right"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">سعر Steam ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.steamPrice}
                        onChange={e => setFormData({ ...formData, steamPrice: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white focus:border-cyan-500 outline-none text-right"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">المخزون (الكمية)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none text-right"
                    placeholder="0"
                  />
                </div>

                {/* Delivery Details Section */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400">تفاصيل التسليم (تظهر للمشتري)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">نوع التسليم</label>
                      <select
                        value={formData.deliveryType}
                        onChange={e => setFormData({ ...formData, deliveryType: e.target.value as DeliveryType })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none text-right"
                      >
                        <option value="Steam Key">Steam Key (مفتاح)</option>
                        <option value="Steam Account">Steam Account (حساب)</option>
                        <option value="Discord Nitro Gift">Discord Nitro Gift (هدية)</option>
                        <option value="Other">Other (آخر)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-400">البيانات (المفتاح / الحساب / الرابط)</label>
                      <input
                        type="text"
                        required
                        value={formData.deliveryDetails}
                        onChange={e => setFormData({ ...formData, deliveryDetails: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none text-right"
                        placeholder="أدخل الكود أو بيانات الدخول هنا"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">تعليمات الاستخدام (اختياري)</label>
                    <textarea
                      rows={2}
                      value={formData.deliveryInstructions}
                      onChange={e => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none resize-none text-right"
                      placeholder="مثال: قم بتفعيل الكود في متجر Steam..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {editingId ? 'تحديث اللعبة' : 'حفظ اللعبة'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-white/5 text-xs font-bold uppercase tracking-widest text-gray-500">
              <th className="p-6">اللعبة</th>
              <th className="p-6">النوع</th>
              <th className="p-6">المخزون</th>
              <th className="p-6">سعرنا</th>
              <th className="p-6 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {games.map(game => (
              <tr key={game.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <img src={game.imageUrl} alt={game.title} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className="font-bold text-white">{game.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{game.description}</div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-md">
                    {game.deliveryType || 'Steam Key'}
                  </span>
                </td>
                <td className="p-6">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    (game.stock || 0) > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                  }`}>
                    {game.stock || 0}
                  </span>
                </td>
                <td className="p-6 font-black text-cyan-400">${game.ourPrice}</td>
                <td className="p-6 text-left">
                  <div className="flex items-center justify-start gap-2">
                    <button onClick={() => startEdit(game)} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(game.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {games.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="p-20 text-center text-gray-500 italic">لم يتم العثور على ألعاب.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageGames;
