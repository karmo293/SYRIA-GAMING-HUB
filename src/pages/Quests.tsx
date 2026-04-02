import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Quest, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Star, 
  Zap, 
  CheckCircle2, 
  Lock, 
  Gift, 
  ArrowRight,
  Target,
  Users,
  MessageSquare,
  Share2,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import DailyMissions from '../components/DailyMissions';

const Quests = () => {
  const { user, userProfile } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'quests'));
        setQuests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest)));
      } catch (error) {
        console.error("Error fetching quests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuests();
  }, []);

  const getQuestProgress = (questId: string) => {
    const userQuest = userProfile?.quests?.find(q => q.id === questId);
    return userQuest || { progress: 0, completed: false };
  };

  const handleClaim = async (quest: Quest) => {
    if (!user || claiming) return;
    setClaiming(quest.id);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: increment(quest.rewardXp),
        walletBalance: increment(quest.rewardCoins),
        'quests': userProfile?.quests?.map(q => q.id === quest.id ? { ...q, completed: true } : q)
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27D26]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 bg-[#F27D26]/10 rounded-full border border-[#F27D26]/20 mb-6"
            >
              <Trophy className="w-4 h-4 text-[#F27D26] mr-2" />
              <span className="text-[#F27D26] text-xs font-bold uppercase tracking-widest">Performance Rewards</span>
            </motion.div>
            <h1 className="text-6xl font-bold text-white mb-4">Level Up Your Experience</h1>
            <p className="text-gray-400 text-xl font-serif italic max-w-2xl">
              Complete daily and weekly quests to earn XP, unlock exclusive discounts, and boost your wallet balance.
            </p>
          </div>

          <div className="bg-[#141414] p-8 rounded-3xl border border-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Your Level</p>
                <h3 className="text-4xl font-bold text-white">Lvl {userProfile?.level || 1}</h3>
              </div>
              <div className="w-16 h-16 bg-[#F27D26]/10 rounded-2xl flex items-center justify-center border border-[#F27D26]/20">
                <Zap className="w-8 h-8 text-[#F27D26]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-gray-500">XP Progress</span>
                <span className="text-[#F27D26]">{userProfile?.xp || 0} / 5000</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((userProfile?.xp || 0) / 5000) * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#F27D26] to-[#d96a1a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Missions Section */}
        <div className="mb-12">
          <DailyMissions />
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest, index) => {
            const { progress, completed } = getQuestProgress(quest.id);
            const isReadyToClaim = progress >= quest.target && !completed;
            const progressPercent = Math.min((progress / quest.target) * 100, 100);

            return (
              <motion.div 
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group relative bg-[#141414] rounded-3xl border border-white/10 overflow-hidden transition-all hover:border-[#F27D26]/50 ${
                  completed ? 'opacity-60' : ''
                }`}
              >
                {/* Quest Icon Overlay */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  {quest.category === 'social' ? <Share2 className="w-12 h-12" /> : 
                   quest.category === 'shopping' ? <ShoppingBag className="w-12 h-12" /> :
                   quest.category === 'review' ? <MessageSquare className="w-12 h-12" /> :
                   <Target className="w-12 h-12" />}
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-xl ${
                      completed ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-400'
                    }`}>
                      {completed ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
                      {quest.category} Quest
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{quest.title}</h3>
                  <p className="text-sm text-gray-400 mb-8 line-clamp-2">{quest.description}</p>

                  {/* Rewards */}
                  <div className="flex gap-4 mb-8">
                    <div className="flex items-center text-xs font-bold text-[#F27D26]">
                      <Star className="w-4 h-4 mr-1 fill-[#F27D26]" />
                      +{quest.rewardXp} XP
                    </div>
                    <div className="flex items-center text-xs font-bold text-green-500">
                      <Zap className="w-4 h-4 mr-1 fill-green-500" />
                      +${quest.rewardCoins} Credits
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-white">{progress} / {quest.target}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className={`h-full ${completed ? 'bg-green-500' : 'bg-[#F27D26]'}`}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8">
                    {completed ? (
                      <button disabled className="w-full py-4 bg-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center">
                        Completed
                      </button>
                    ) : isReadyToClaim ? (
                      <button 
                        onClick={() => handleClaim(quest)}
                        disabled={claiming === quest.id}
                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-green-500/20"
                      >
                        {claiming === quest.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Reward'}
                      </button>
                    ) : (
                      <button disabled className="w-full py-4 bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center border border-white/10">
                        <Lock className="w-4 h-4 mr-2" /> Locked
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Level Rewards Section */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-bold text-white">Level Milestone Rewards</h2>
            <div className="h-px flex-1 bg-white/10 mx-8 hidden md:block"></div>
            <Gift className="w-8 h-8 text-[#F27D26]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[5, 10, 25, 50].map((lvl) => (
              <div key={lvl} className={`p-8 rounded-3xl border ${
                (userProfile?.level || 1) >= lvl ? 'bg-[#F27D26]/5 border-[#F27D26]/20' : 'bg-[#141414] border-white/10 opacity-50'
              }`}>
                <div className="text-4xl font-bold text-white mb-4">Lvl {lvl}</div>
                <h4 className="text-lg font-bold text-white mb-2">
                  {lvl === 5 ? 'Bronze Pack' : lvl === 10 ? 'Silver Pack' : lvl === 25 ? 'Gold Pack' : 'Legendary Pack'}
                </h4>
                <p className="text-sm text-gray-500 mb-6">
                  {lvl === 5 ? 'Unlock 5% extra discount on all keys.' : 
                   lvl === 10 ? 'Free $10 wallet credit and Silver badge.' :
                   lvl === 25 ? 'Early access to new releases and Gold badge.' :
                   'Lifetime 15% discount and Legendary status.'}
                </p>
                {(userProfile?.level || 1) >= lvl ? (
                  <span className="text-xs font-bold text-[#F27D26] uppercase tracking-widest flex items-center">
                    Unlocked <CheckCircle2 className="w-4 h-4 ml-2" />
                  </span>
                ) : (
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center">
                    Locked <Lock className="w-4 h-4 ml-2" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quests;
