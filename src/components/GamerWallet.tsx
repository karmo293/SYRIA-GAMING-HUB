import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Wallet, Star, Trophy, Coins } from 'lucide-react';
import { cn } from '../lib/utils';

const GamerWallet: React.FC = () => {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  const xp = userProfile.xp || 0;
  const level = userProfile.level || 1;
  const points = userProfile.points || 0;
  const progress = (xp % 1000) / 10; // Percentage for current level

  return (
    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
      {/* Wallet Balance */}
      <div className="flex items-center gap-2 border-l border-white/10 pl-4">
        <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/30">
          <Wallet className="text-yellow-400 w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">المحفظة</span>
          <span className="text-xs font-black text-white">{userProfile.walletBalance?.toFixed(2) || '0.00'} $</span>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center gap-2 border-l border-white/10 pl-4">
        <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/30">
          <Coins className="text-purple-400 w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">النقاط</span>
          <span className="text-xs font-black text-white">{points}</span>
        </div>
      </div>

      {/* XP & Level */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/30">
            <Trophy className="text-cyan-400 w-5 h-5" />
          </div>
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-cyan-500 text-black rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#0a0a0a]">
            {level}
          </div>
        </div>
        <div className="flex flex-col gap-1 w-24">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">XP</span>
            <span className="text-[10px] font-bold text-cyan-400">{xp % 1000} / 1000</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamerWallet;
