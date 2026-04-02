import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles, ChevronDown, Minimize2, Maximize2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: 'مرحباً! أنا مساعدك الذكي في Syria Gaming Hub. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date().toISOString()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getPageContext = (path: string) => {
    if (path.startsWith('/game/')) return 'صفحة تفاصيل اللعبة - تعرض معلومات اللعبة، الأسعار، التقييمات، وفحص التوافق.';
    if (path.startsWith('/product/')) return 'صفحة تفاصيل المنتج - تعرض معلومات المنتج الرقمي (مفاتيح، عملات) وخيارات الشراء.';
    
    switch (path) {
      case '/': return 'الصفحة الرئيسية - تعرض أحدث الألعاب والعروض.';
      case '/games': return 'صفحة الألعاب - تحتوي على مكتبة الألعاب الكاملة مع إمكانية البحث والفلترة.';
      case '/store': return 'المتجر - يحتوي على منتجات رقمية مثل بطاقات الشحن والعملات الافتراضية.';
      case '/cart': return 'سلة التسوق - حيث يمكن للمستخدم مراجعة مشترياته قبل الدفع.';
      case '/orders': return 'طلباتي - تعرض سجل المشتريات والفواتير الخاصة بالمستخدم.';
      case '/profile': return 'الملف الشخصي - يحتوي على ألعابك، قائمة الأمنيات، وربط حساب Steam.';
      case '/admin': return 'لوحة تحكم المسؤول - حيث يتم إدارة الألعاب والطلبات والمستخدمين.';
      default: return 'تصفح الموقع العام.';
    }
  };

  const getSuggestedQuestions = (path: string) => {
    if (path.startsWith('/game/')) return ['هل جهازي يشغل هذه اللعبة؟', 'كيف أحصل على أفضل سعر؟', 'هل اللعبة تدعم الأونلاين؟'];
    if (path.startsWith('/product/')) return ['كيف يتم تسليم الكود؟', 'هل هذا المنتج مضمون؟', 'كيف أشحن رصيدي؟'];
    
    switch (path) {
      case '/': return ['ما هي أحدث العروض؟', 'كيف أنشئ حساباً؟', 'ما هي طرق الدفع المتاحة؟'];
      case '/games': return ['ابحث لي عن ألعاب أكشن', 'أرخص الألعاب حالياً', 'ألعاب تدعم اللغة العربية'];
      case '/profile': return ['كيف أربط حساب Steam؟', 'عرض قائمة أمنياتي', 'تغيير اسمي المستعار'];
      case '/orders': return ['أين أجد كود اللعبة؟', 'كيف أفعل الضمان الذكي؟', 'مشكلة في الطلب'];
      default: return ['كيف أتواصل معكم؟', 'ما هو Syria Gaming Hub؟'];
    }
  };

  const handleSendMessage = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const messageText = typeof e === 'string' ? e : input;
    
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      text: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (typeof e !== 'string') setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const context = getPageContext(location.pathname);
      const userDisplayName = userProfile?.displayName || user?.email?.split('@')[0] || 'لاعبنا العزيز';

      const systemInstruction = `
        أنت مساعد ذكي في موقع "Syria Gaming Hub" (مركز سوريا للألعاب).
        اسم المستخدم الحالي: ${userDisplayName}.
        المستخدم يتواجد حالياً في: ${context}.
        
        مهامك:
        1. الإجابة على استفسارات المستخدم حول الألعاب والمنتجات المتوفرة.
        2. تقديم المساعدة بناءً على الصفحة التي يتواجد فيها المستخدم (مثلاً: إذا كان في صفحة الألعاب، ساعده في العثور على ألعاب معينة).
        3. كن ودوداً، مهنياً، واستخدم اللغة العربية (اللهجة السورية أو الفصحى البسيطة).
        4. إذا سأل المستخدم عن طلباته، وجهه لصفحة "طلباتي".
        5. إذا واجه مشكلة في الدفع، اشرح له الخطوات أو وجهه للدعم الفني.
        6. إذا كان في صفحة الملف الشخصي، شجعه على ربط حساب Steam للحصول على توصيات مخصصة.
        7. إذا كان في صفحة الطلبات، ذكره بميزة "الضمان الذكي" لحماية مشترياته.
        
        معلومات عن الموقع:
        - نحن نقدم أفضل الأسعار للألعاب في سوريا.
        - نوفر بطاقات شحن (Steam, UC, Discord Nitro).
        - لدينا نظام طلبات وفواتير متطور.
        - نوفر ميزة "تأمين السعر" و "المزاد العكسي" و "الضمان الذكي".
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: input }] }
        ],
        config: {
          systemInstruction,
        }
      });
      
      const modelMessage: Message = {
        role: 'model',
        text: response.text || 'عذراً، لم أستطع فهم ذلك. هل يمكنك إعادة الصياغة؟',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("AI Chatbot Error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: 'عذراً، واجهت مشكلة في الاتصال. يرجى المحاولة مرة أخرى لاحقاً.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '80px' : '600px',
              width: isMinimized ? '300px' : '400px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden mb-4 transition-all duration-300",
              isMinimized && "rounded-3xl"
            )}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
                  <Bot className="text-cyan-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">المساعد الذكي</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">متصل الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                >
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "flex gap-3",
                        m.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                        m.role === 'user' 
                          ? "bg-white/5 border-white/10" 
                          : "bg-cyan-500/10 border-cyan-500/20"
                      )}>
                        {m.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                        m.role === 'user'
                          ? "bg-white/5 text-white rounded-tl-none border border-white/10"
                          : "bg-cyan-500/5 text-gray-300 rounded-tr-none border border-cyan-500/10"
                      )}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      </div>
                      <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-2xl rounded-tr-none">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Questions */}
                <div className="px-6 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                  {getSuggestedQuestions(location.pathname).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="whitespace-nowrap bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-400 hover:text-white transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-white/5">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="اسألني أي شيء..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pr-6 pl-14 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-black rounded-xl flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">مدعوم بتقنيات الذكاء الاصطناعي</span>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all relative group",
          isOpen ? "bg-white text-black" : "bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)]"
        )}
      >
        {isOpen ? <ChevronDown className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
        {!isOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-cyan-500">
            1
          </div>
        )}
        
        {/* Label/Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 pointer-events-none">
          <div className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase italic tracking-tighter opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 shadow-xl whitespace-nowrap">
            🤖 المساعد الذكي (أبو بهاء)
          </div>
          <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 px-3 py-1 rounded-lg text-[9px] font-bold text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 delay-75">
            متصل وجاهز للمساعدة
          </div>
        </div>
      </motion.button>
    </div>
  );
};

export default AIChatbot;
