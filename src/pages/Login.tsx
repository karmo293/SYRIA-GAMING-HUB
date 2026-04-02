import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion } from 'motion/react';
import { Gamepad2, Mail, Lock, LogIn, UserPlus, Chrome, ArrowRight, RefreshCw } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccess('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        setIsForgotPassword(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile
        const isAdminEmail = user.email === 'karmo2931@gmail.com' || user.email === 'raskohilal99@gmail.com' || user.email === 'rea2ife@gmail.com';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          ownedGames: [],
          wishlist: [],
          notifications: []
        });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (!docSnap.exists()) {
        const isAdminEmail = user.email === 'karmo2931@gmail.com' || user.email === 'raskohilal99@gmail.com' || user.email === 'rea2ife@gmail.com';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          ownedGames: [],
          wishlist: [],
          notifications: []
        });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Gamepad2 className="text-black w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black uppercase italic">
            {isForgotPassword ? 'إعادة تعيين كلمة المرور' : isLogin ? 'مرحباً بك مجدداً' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-2">
            {isForgotPassword 
              ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة التعيين' 
              : isLogin ? 'سجل دخولك للوصول إلى مكتبتك الرقمية' : 'انضم إلى مجتمع اللاعبين النخبة'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mr-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-right"
                placeholder="gamer@example.com"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mr-1">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">كلمة المرور</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isForgotPassword}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pr-12 pl-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-right"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-black py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isForgotPassword ? <RefreshCw className="w-5 h-5" /> : isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                {isForgotPassword ? 'إرسال رابط التعيين' : isLogin ? 'دخول' : 'تسجيل'}
              </>
            )}
          </button>
        </form>

        {isForgotPassword && (
          <button
            onClick={() => setIsForgotPassword(false)}
            className="w-full mt-4 text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> العودة للدخول
          </button>
        )}

        {!isForgotPassword && (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-[#111] px-4 text-gray-500 font-bold">أو تابع باستخدام</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <Chrome className="w-5 h-5" /> جوجل
            </button>

            <p className="text-center text-gray-500 text-sm mt-8">
              {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors"
              >
                {isLogin ? 'سجل الآن' : 'دخول الآن'}
              </button>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
