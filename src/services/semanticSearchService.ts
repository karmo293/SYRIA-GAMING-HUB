import { GoogleGenAI } from "@google/genai";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Game, Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const semanticSearch = async (query: string) => {
  try {
    // 1. Fetch all items (in a real app, we'd use vector embeddings, but for this demo we'll use LLM reasoning)
    const gamesSnap = await getDocs(collection(db, 'games'));
    const productsSnap = await getDocs(collection(db, 'products'));

    const items = [
      ...gamesSnap.docs.map(doc => ({ id: doc.id, type: 'game', ...doc.data() })),
      ...productsSnap.docs.map(doc => ({ id: doc.id, type: 'product', ...doc.data() }))
    ];

    // 2. Use Gemini to filter and rank items based on semantic meaning
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        User Search Query: "${query}"
        
        Available Items:
        ${JSON.stringify(items.map(i => ({ id: i.id, title: (i as any).title, description: (i as any).description, type: i.type })))}
        
        Task: Identify which items best match the user's intent. Return ONLY a JSON array of IDs in order of relevance.
        If no items match, return an empty array [].
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const matchedIds = JSON.parse(response.text || "[]");
    return items.filter(item => matchedIds.includes(item.id));
  } catch (error) {
    console.error("Semantic search error:", error);
    return [];
  }
};
