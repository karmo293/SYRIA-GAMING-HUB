import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Clock, Info, CheckCircle2, Loader2, Camera, Video, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface WarrantyCheckerProps {
  orderId: string;
  deliveryDetails: string;
  existingLogs?: any[];
}

const WarrantyChecker: React.FC<WarrantyCheckerProps> = ({ orderId, deliveryDetails, existingLogs = [] }) => {
  const { user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [logs, setLogs] = useState(existingLogs);

  const handleLogActivation = async () => {
    if (!user) return;
    setIsLogging(true);
    
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/orders/log-warranty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ orderId, action: 'activate' })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل تفعيل الضمان');
      }

      const newLog = {
        action: 'Code Revealed & Activation Logged',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        status: 'Verified'
      };

      setLogs(prev => [...prev, newLog]);
      setIsLogging(false);
      setShowDetails(true);
    } catch (error) {
      console.error("Error logging warranty:", error);
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء تفعيل الضمان");
      setIsLogging(false);
    }
  };

  const isVerified = logs.length > 0;

  return (
    <div className="mt-4">
      {!isVerified ? (
        <button
          onClick={handleLogActivation}
          disabled={isLogging}
          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all group"
        >
          {isLogging ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
              تفعيل الضمان الذكي (Smart Warranty)
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500">الضمان مفعل ومسجل</span>
            </div>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors underline"
            >
              {showDetails ? 'إخفاء السجل' : 'عرض السجل'}
            </button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 mb-2">
                    <Video className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">سجل التسليم الآمن</span>
                  </div>
                  
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-3 text-[10px] border-l-2 border-cyan-500/30 pl-3 py-1">
                      <div className="flex-1">
                        <p className="text-white font-bold mb-1">{log.action}</p>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                      <div className="bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-400 font-black">
                        {log.status}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-white/5 rounded-lg flex items-center gap-3">
                    <Lock className="text-gray-600 w-4 h-4" />
                    <p className="text-[9px] text-gray-500 leading-relaxed italic">
                      تم تسجيل بصمة الجهاز والمتصفح لضمان حقك وحق المتجر في حال حدوث أي مشكلة في الكود.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default WarrantyChecker;
