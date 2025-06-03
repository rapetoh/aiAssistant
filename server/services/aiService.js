import OpenAI from 'openai';
import { AI_CONFIG } from '../config/aiConfig.js';

class AIService {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    if (!AI_CONFIG.openai?.apiKey) {
      throw new Error('OpenAI API key not found. Please set REMOVED environment variable.');
    }
    this.openai = new OpenAI({ apiKey: AI_CONFIG.openai.apiKey });
    console.log('OpenAI initialized successfully');
  }

  async generateResponse(messages) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const response = await this.openai.chat.completions.create({
        model: AI_CONFIG.openai.model,
        messages: messages,
        temperature: AI_CONFIG.openai.temperature,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;
