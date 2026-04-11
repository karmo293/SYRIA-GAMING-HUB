import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { aiService } from '../services/aiService';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({ onSearch, placeholder = "تحدث للبحث..." }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;
  }

  const startListening = () => {
    if (!recognition) {
      setErrorMessage('متصفحك لا يدعم البحث الصوتي.');
      return;
    }
    setErrorMessage(null);
    setIsListening(true);
    setTranscript('');
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = async (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current][0].transcript;
      setTranscript(result);
      setIsListening(false);
      
      // Process with AI to map gamer slang
      await processWithAI(result);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setErrorMessage('يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح.');
      } else if (event.error === 'no-speech') {
        setErrorMessage('لم يتم اكتشاف صوت. حاول مرة أخرى.');
      } else {
        setErrorMessage('حدث خطأ في التعرف على الصوت.');
      }

      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    };
  }, [recognition]);

  const processWithAI = async (text: string) => {
    setIsProcessing(true);
    try {
      const prompt = `
        أنت خبير في مصطلحات الجيمرز (Gamer Slang). 
        قم بتحويل النص التالي المأخوذ من بحث صوتي إلى كلمات بحث دقيقة للمتجر.
        أمثلة:
        - "بدي شدات" -> "UC PUBG"
        - "سكنات فورتنايت" -> "Fortnite V-Bucks"
        - "اشتراك ديسكورد" -> "Discord Nitro"
        - "ألعاب سوني" -> "PlayStation"
        - "بي سي" -> "PC Games"
        
        النص: "${text}"
        رد بالكلمات المفتاحية فقط باللغة الإنجليزية أو العربية الفصحى حسب الأنسب للمنتج.
      `;

      const response = await aiService.chat(prompt);
      const processedQuery = response.text.trim();
      onSearch(processedQuery);
    } catch (error) {
      console.error('AI Processing error:', error);
      onSearch(text); // Fallback to raw transcript
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative flex items-center">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={cn(
          "p-2 rounded-xl transition-all flex items-center justify-center",
          isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/5 text-gray-400 hover:text-cyan-400 hover:bg-white/10",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
        title="بحث صوتي"
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute right-full mr-4 bg-black/90 border border-cyan-500/30 backdrop-blur-xl p-4 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.2)] whitespace-nowrap z-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [8, 16, 8] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-1 bg-cyan-500 rounded-full"
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-white">{placeholder}</span>
            </div>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 right-0 bg-red-500/10 border border-red-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 whitespace-nowrap z-50"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceSearch;
