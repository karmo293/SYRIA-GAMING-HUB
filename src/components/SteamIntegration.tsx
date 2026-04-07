import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link2, RefreshCw, Gamepad2, Sparkles, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

const SteamIntegration: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleLinkSteam = async () => {
    if (!user) return;
    setIsLinking(true);
    
    try {
      const response = await fetch('/api/steam/link', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.url) {
        // Simulate successful link for now
        setTimeout(async () => {
          const syncResponse = await fetch('/api/steam/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, steamId: '76561198000000000' })
          });
          const syncData = await syncResponse.json();
          
          if (syncData.success) {
            const mockSteamProfile = {
              steamId: '76561198000000000',
              personaname: 'GamerPro_SY',
              avatarfull: 'https://picsum.photos/seed/steam/200/200',
              profileurl: 'https://steamcommunity.com/id/gamerpro_sy'
            };
            const mockGames = [
              'Counter-Strike 2',
              'Dota 2',
              'Cyberpunk 2077',
              'Elden Ring',
              'The Witcher 3: Wild Hunt',
              'PUBG: BATTLEGROUNDS'
            ];
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              steamId: mockSteamProfile.steamId,
              steamProfile: mockSteamProfile,
              steamGames: mockGames
            });
            setIsLinking(false);
            analyzeGames(mockGames);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error linking Steam:", error);
      setIsLinking(false);
    }
  };

  const analyzeGames = async (games: string[]) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        بناءً على قائمة ألعاب المستخدم في Steam: ${games.join(', ')}.
        اقترح 3 ألعاب أو منتجات رقمية (مثل عملات ألعاب أو بطاقات شحن) قد تهمه من متجرنا.
        المتجر يوفر: مفاتيح ألعاب، عملات (UC, Discord Nitro, Steam Wallet)، وحسابات ألعاب.
        
        أرجع النتيجة بصيغة JSON كقائمة من الأشياء المقترحة مع سبب الاقتراح.
        مثال: [{ "title": "Elden Ring: Shadow of the Erdtree", "reason": "بما أنك لعبت Elden Ring الأصلية..." }]
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text || '[]');
      setRecommendations(data);
    } catch (error) {
      console.error("AI Analysis Error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (userProfile?.steamId) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img 
                src={userProfile.steamProfile?.avatarfull} 
                alt="Steam Avatar" 
                className="w-20 h-20 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#171a21] rounded-lg flex items-center justify-center border border-white/10">
                <Link2 className="text-cyan-400 w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">حساب Steam المرتبط</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-white italic">{userProfile.steamProfile?.personaname}</h3>
              <a 
                href={userProfile.steamProfile?.profileurl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1"
              >
                عرض الملف الشخصي <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <button 
            onClick={() => analyzeGames(userProfile.steamGames || [])}
            disabled={isAnalyzing}
            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/10 flex items-center gap-2"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            تحديث التوصيات الذكية
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-cyan-400 w-5 h-5" />
            <h4 className="text-sm font-black uppercase italic text-white">توصيات الذكاء الاصطناعي لك</h4>
          </div>

          {isAnalyzing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-cyan-500/30 transition-all group"
                >
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="text-cyan-400 w-5 h-5" />
                  </div>
                  <h5 className="font-bold text-white mb-2 line-clamp-1">{rec.title}</h5>
                  <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{rec.reason}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-black/20 rounded-2xl border border-dashed border-white/5">
              <p className="text-gray-500 text-sm italic">اضغط على "تحديث التوصيات" لتحليل ألعابك واقتراح الأفضل لك.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#171a21] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
          <Link2 className="text-cyan-400 w-10 h-10" />
        </div>
        
        <h3 className="text-3xl font-black uppercase italic mb-4 text-white">اربط حساب Steam الخاص بك</h3>
        <p className="text-gray-400 mb-10 max-w-md leading-relaxed">
          دع الذكاء الاصطناعي يحلل مكتبة ألعابك ليقدم لك أفضل العروض، مفاتيح الألعاب، والعملات الرقمية المخصصة لاهتماماتك.
        </p>

        <button
          onClick={handleLinkSteam}
          disabled={isLinking}
          className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-black px-10 py-5 rounded-2xl font-black uppercase italic transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(6,182,212,0.3)]"
        >
          {isLinking ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              جاري الربط...
            </>
          ) : (
            <>
              <Link2 className="w-6 h-6" />
              ربط الحساب الآن
            </>
          )}
        </button>

        <p className="mt-6 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          * نستخدم فقط معلومات الألعاب العامة لتحسين تجربتك
        </p>
      </div>
    </div>
  );
};

export default SteamIntegration;
