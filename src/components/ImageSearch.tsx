import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Search } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ImageSearchProps {
  onResults: (results: (Game | Product)[]) => void;
  onClose: () => void;
}

const ImageSearch: React.FC<ImageSearchProps> = ({ onResults, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async () => {
    if (!image) return;
    setLoading(true);

    try {
      // 1. Fetch inventory
      const gamesSnap = await getDocs(collection(db, 'games'));
      const productsSnap = await getDocs(collection(db, 'products'));
      const inventory = [
        ...gamesSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title, description: doc.data().description, type: 'game' })),
        ...productsSnap.docs.map(doc => ({ id: doc.id, title: doc.data().title, description: doc.data().description, type: 'product' }))
      ];

      // 2. Use Gemini to analyze image and find matches
      const base64Data = image.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
              { text: `
                Analyze this image and find the best matching items from our inventory.
                Inventory:
                ${JSON.stringify(inventory)}
                
                Task: Return a JSON array of IDs for the items that best match the product in the image.
                Return ONLY the JSON array.
              ` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const matchedIds = JSON.parse(response.text || "[]");
      
      // 3. Get full items
      const allItems = [
        ...gamesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)),
        ...productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
      ];
      
      const results = allItems.filter(item => matchedIds.includes(item.id));
      onResults(results);
      onClose();
    } catch (error) {
      console.error("Image search error:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-[#141414] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Camera className="w-5 h-5 mr-2 text-cyan-400" />
            البحث بالصور
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-white/5 transition-all group"
            >
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-white font-bold mb-1">ارفع صورة للمنتج</p>
              <p className="text-gray-500 text-xs">PNG, JPG up to 10MB</p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-2xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري التحليل...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    ابحث عن منتجات مشابهة
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-black/40 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Powered by Gemini Vision AI
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageSearch;
