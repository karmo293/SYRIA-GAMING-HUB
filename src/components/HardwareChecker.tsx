import React, { useState, useEffect } from 'react';
import { Monitor, Cpu, HardDrive, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface HardwareSpecs {
  cores: number;
  memory: number;
  platform: string;
}

const HardwareChecker: React.FC<{ gameTitle: string }> = ({ gameTitle }) => {
  const [specs, setSpecs] = useState<HardwareSpecs | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ status: 'high' | 'medium' | 'low' | 'unsupported', message: string } | null>(null);

  useEffect(() => {
    // Get basic hardware info
    const getSpecs = () => {
      const cores = navigator.hardwareConcurrency || 4;
      // @ts-ignore - deviceMemory is not in all browsers
      const memory = navigator.deviceMemory || 8;
      const platform = navigator.platform;
      setSpecs({ cores, memory, platform });
    };
    getSpecs();
  }, []);

  const runCheck = () => {
    setChecking(true);
    
    if (!specs) {
      setChecking(false);
      return;
    }

    let status: 'high' | 'medium' | 'low' | 'unsupported' = 'medium';
    let message = '';

    if (specs.memory >= 16 && specs.cores >= 8) {
      status = 'high';
      message = `ستعمل لعبة ${gameTitle} لديك بأعلى جودة (Ultra Settings) بسلاسة تامة.`;
    } else if (specs.memory >= 8 && specs.cores >= 4) {
      status = 'medium';
      message = `ستعمل لعبة ${gameTitle} لديك بجودة جيدة (High/Medium Settings).`;
    } else if (specs.memory >= 4) {
      status = 'low';
      message = `ستعمل لعبة ${gameTitle} لديك على أقل إعدادات. قد تواجه بعض التقطيع.`;
    } else {
      status = 'unsupported';
      message = `للأسف، جهازك قد لا يدعم تشغيل ${gameTitle} بشكل جيد.`;
    }

    setResult({ status, message });
    setChecking(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
          <Monitor className="text-cyan-400 w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">فحص التوافق (Hardware Checker)</h3>
          <p className="text-gray-500 text-xs font-medium">تأكد من أن جهازك قادر على تشغيل اللعبة</p>
        </div>
      </div>

      {!result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <Cpu className="text-gray-500 w-5 h-5" />
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">المعالج</p>
                <p className="text-sm font-bold text-white">{specs?.cores} Cores</p>
              </div>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <HardDrive className="text-gray-500 w-5 h-5" />
              <div>
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">الرامات</p>
                <p className="text-sm font-bold text-white">{specs?.memory} GB</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={runCheck}
            disabled={checking}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-black py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Info className="w-5 h-5" />
                </motion.div>
                جاري الفحص...
              </>
            ) : (
              'ابدأ فحص التوافق الذكي'
            )}
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-2xl border flex flex-col items-center text-center gap-4",
            result.status === 'high' && "bg-green-500/10 border-green-500/30 text-green-400",
            result.status === 'medium' && "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
            result.status === 'low' && "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
            result.status === 'unsupported' && "bg-red-500/10 border-red-500/30 text-red-400"
          )}
        >
          {result.status === 'unsupported' ? <AlertCircle className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
          <p className="text-sm font-bold leading-relaxed">{result.message}</p>
          <button 
            onClick={() => setResult(null)}
            className="text-[10px] font-black uppercase tracking-widest underline opacity-50 hover:opacity-100"
          >
            إعادة الفحص
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default HardwareChecker;
