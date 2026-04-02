import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const searchProductsAI = async (query: string, products: any[]) => {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Find the most relevant products from this list for the query: "${query}". 
    Products: ${JSON.stringify(products.map(p => ({ id: p.id, title: p.title, category: p.category })))}
    Return only a JSON array of product IDs.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Search Error:", e);
    return [];
  }
};

export const getRecommendationsAI = async (productId: string, products: any[]) => {
  const model = "gemini-3-flash-preview";
  const currentProduct = products.find(p => p.id === productId);
  if (!currentProduct) return [];

  const response = await ai.models.generateContent({
    model,
    contents: `The user is looking at: ${JSON.stringify(currentProduct)}. 
    Suggest 3 complementary products from this list: ${JSON.stringify(products.filter(p => p.id !== productId).map(p => ({ id: p.id, title: p.title, category: p.category })))}
    Return only a JSON array of product IDs.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Recommendation Error:", e);
    return [];
  }
};
