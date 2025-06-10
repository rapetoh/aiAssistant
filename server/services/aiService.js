import OpenAI from 'openai';
import axios from 'axios';
import { AI_CONFIG } from '../config/aiConfig.js';

class AIService {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    if (AI_CONFIG.openai?.enabled && AI_CONFIG.openai?.apiKey) {
      this.openai = new OpenAI({ apiKey: AI_CONFIG.openai.apiKey });
      console.log('OpenAI initialized successfully');
    }
  }

  async generateResponse(messages, provider = AI_CONFIG.defaultProvider, onStream = null) {
    try {
      if (provider == 'openai') {
        if (!this.openai) {
          throw new Error('OpenAI not initialized');
        }

        const response = await this.openai.chat.completions.create({
          model: AI_CONFIG.openai.model,
          messages: messages,
          temperature: AI_CONFIG.openai.temperature,
        });

        return response.choices[0].message.content;
      } 
      // else if (provider === 'local') {
      //   // Build prompt from full chat history
      //   const prompt = messages
      //     .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      //     .join('\n') + '\nAssistant:';
        
      //   console.log('=== Ollama Request Details ===');
      //   console.log('URL:', `${AI_CONFIG.local.baseUrl}/api/generate`);
      //   console.log('Model:', AI_CONFIG.local.model);
      //   console.log('Prompt:', prompt);
        
      //   const requestBody = {
      //     model: AI_CONFIG.local.model,
      //     prompt: prompt,
      //     temperature: AI_CONFIG.local.temperature,
      //     context_size: AI_CONFIG.local.contextSize,
      //     stream: true,  // Enable streaming
      //     options: {
      //       num_predict: -1,
      //       stop: ["Human:", "Assistant:"]
      //     }
      //   };
        
      //   console.log('Request Body:', JSON.stringify(requestBody, null, 2));
        
      //   try {
      //     console.log('Sending streaming request to Ollama...');
      //     const response = await axios.post(`${AI_CONFIG.local.baseUrl}/api/generate`, requestBody, {
      //       responseType: 'stream'
      //     });

      //     let fullResponse = '';
          
      //     return new Promise((resolve, reject) => {
      //       response.data.on('data', (chunk) => {
      //         try {
      //           const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
      //           for (const line of lines) {
      //             const data = JSON.parse(line);
      //             if (data.response) {
      //               fullResponse += data.response;
      //               if (onStream) {
      //                 onStream(data.response);
      //               }
      //             }
      //             if (data.done) {
      //               resolve(fullResponse.trim());
      //             }
      //           }
      //         } catch (error) {
      //           console.error('Error processing stream chunk:', error);
      //         }
      //       });

      //       response.data.on('error', (error) => {
      //         console.error('Stream error:', error);
      //         reject(error);
      //       });

      //       response.data.on('end', () => {
      //         if (!fullResponse) {
      //           reject(new Error('No response received from Ollama'));
      //         }
      //       });
      //     });
      //   } catch (error) {
      //     console.error('=== Ollama API Error Details ===');
      //     console.error('Error Message:', error.message);
      //     console.error('Error Response:', error.response?.data);
      //     console.error('Error Status:', error.response?.status);
      //     console.error('Request Config:', {
      //       url: error.config?.url,
      //       method: error.config?.method,
      //       headers: error.config?.headers,
      //       data: error.config?.data
      //     });
      //     throw error;
      //   }
      // } 
      else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;
