export interface AIChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const aiService = {
  async chat(message: string, history: AIChatMessage[] = []) {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!response.ok) throw new Error('AI Chat failed');
    return response.json();
  },

  async getRecommendations(games: string[]) {
    const response = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ games }),
    });
    if (!response.ok) throw new Error('AI Recommendations failed');
    return response.json();
  },

  async analyzeImage(image: string, inventory: any[]) {
    const response = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, inventory }),
    });
    if (!response.ok) throw new Error('AI Image Analysis failed');
    return response.json();
  }
};
