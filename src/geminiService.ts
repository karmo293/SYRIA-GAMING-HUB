import { aiService } from "./services/aiService";

export const searchProductsAI = async (query: string, products: any[]) => {
  const prompt = `Find the most relevant products from this list for the query: "${query}". 
    Products: ${JSON.stringify(products.map(p => ({ id: p.id, title: p.title, category: p.category })))}
    Return only a JSON array of product IDs.`;

  try {
    const response = await aiService.chat(prompt);
    const jsonStr = response.text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI Search Error:", e);
    return [];
  }
};

export const getRecommendationsAI = async (productId: string, products: any[]) => {
  const currentProduct = products.find(p => p.id === productId);
  if (!currentProduct) return [];

  const prompt = `The user is looking at: ${JSON.stringify(currentProduct)}. 
    Suggest 3 complementary products from this list: ${JSON.stringify(products.filter(p => p.id !== productId).map(p => ({ id: p.id, title: p.title, category: p.category })))}
    Return only a JSON array of product IDs.`;

  try {
    const response = await aiService.chat(prompt);
    const jsonStr = response.text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI Recommendation Error:", e);
    return [];
  }
};
