import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Gamepad2, 
  ShoppingBag, 
  Plus, 
  Check,
  LayoutGrid,
  Monitor,
  Cpu,
  MousePointer2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { aiService, AIChatMessage } from '../services/aiService';

interface Message {
  role: 'user' | 'model';
  content: string;
  suggestions?: (Game | Product)[];
}

const AIStylist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I'm your AI Gaming Stylist. I can help you build the perfect gaming setup or suggest the best game bundles based on your taste. What are you looking for today? (e.g., 'I want a complete RPG setup' or 'Suggest some competitive FPS games')"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<(Game | Product)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const gamesSnap = await getDocs(collection(db, 'games'));
      const productsSnap = await getDocs(collection(db, 'products'));
      const items = [
        ...gamesSnap.docs.map(doc => ({ id: doc.id, type: 'game', ...doc.data() } as any)),
        ...productsSnap.docs.map(doc => ({ id: doc.id, type: 'product', ...doc.data() } as any))
      ];
      setInventory(items);
    };
    fetchInventory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const history: AIChatMessage[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const inventoryContext = `Available Inventory: ${JSON.stringify(inventory.map(i => ({ id: i.id, title: i.title, description: i.description, price: (i as any).ourPrice || (i as any).price, type: (i as any).type })))}`;
      
      const fullMessage = `[Inventory Context: ${inventoryContext}] User Request: ${userMessage}. Return JSON with "text" and "suggestionIds".`;

      const response = await aiService.chat(fullMessage, history);
      
      // The backend returns { text: "..." }
      // But here we expect JSON with suggestionIds. 
      // I should probably update the backend to handle this or just parse it here.
      // Since I updated the backend to return { text: response.text() }, 
      // I need to parse the text as JSON if it's meant to be JSON.

      const result = JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim() || "{}");
      const suggestions = inventory.filter(item => result.suggestionIds?.includes(item.id));

      setMessages(prev => [...prev, { 
        role: 'model', 
        content: result.text || "I found some great options for you!",
        suggestions 
      }]);
    } catch (error) {
      console.error("AI Stylist error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: "I'm sorry, I hit a lag spike. Could you try rephrasing that?" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-12 px-4 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 bg-[#F27D26]/10 rounded-full border border-[#F27D26]/20 mb-4"
          >
            <Sparkles className="w-4 h-4 text-[#F27D26] mr-2" />
            <span className="text-[#F27D26] text-xs font-bold uppercase tracking-widest">AI Gaming Stylist</span>
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-2">Build Your Ultimate Setup</h1>
          <p className="text-gray-400 font-serif italic">Personalized recommendations for games, gear, and digital assets.</p>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-[#141414] rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-[#F27D26]' : 'bg-white/10'
                    }`}>
                      {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-[#F27D26]" />}
                    </div>
                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-[#F27D26] text-white rounded-tr-none' 
                          : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>

                      {/* Suggestions Grid */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          {msg.suggestions.map((item) => (
                            <motion.div 
                              key={item.id}
                              whileHover={{ scale: 1.02 }}
                              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col"
                            >
                              <img 
                                src={item.imageUrl} 
                                alt={item.title} 
                                className="w-full h-32 object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="p-3 flex-1 flex flex-col">
                                <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                                <p className="text-xs text-gray-500 mb-2">${((item as any).ourPrice || (item as any).price).toFixed(2)}</p>
                                <button 
                                  onClick={() => addToCart({
                                    id: item.id,
                                    title: item.title,
                                    price: (item as any).ourPrice || (item as any).price,
                                    imageUrl: item.imageUrl,
                                    type: (item as any).type,
                                    quantity: 1
                                  })}
                                  className="mt-auto w-full py-2 bg-[#F27D26] hover:bg-[#d96a1a] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add to Cart
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#F27D26] animate-spin" />
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl rounded-tl-none border border-white/10">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-[#F27D26] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-black/40 border-t border-white/10">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your stylist anything..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-[#F27D26] transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center text-white hover:bg-[#d96a1a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                "I want a complete RPG setup",
                "Suggest competitive FPS games",
                "Best subscriptions for a new gamer",
                "Build a budget setup under $100"
              ].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-[#F27D26] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStylist;
