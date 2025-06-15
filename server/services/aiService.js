import OpenAI from 'openai';
import axios from 'axios';
import { AI_CONFIG } from '../config/aiConfig.js';

class AIService {


  async generateResponse(messages, provider = AI_CONFIG.defaultProvider, onStream = null) {
    try {
      if (provider === 'cohere') {
        // Clean messages to remove _id and timestamp fields
        const cleanedMessages = messages.map(({ role, content }) => ({
          role,
          content
        }));

        const response = await axios.post(
          AI_CONFIG.cohere.baseUrl,
          {
            model: AI_CONFIG.cohere.model,
            messages: cleanedMessages,
            stream: true // Enable streaming
          },
          {
            headers: {
              'Authorization': AI_CONFIG.cohere.apiKey,
              'Content-Type': 'application/json',
            },
            responseType: 'stream'
          }
        );

        let fullResponse = '';
        
        return new Promise((resolve, reject) => {
          response.data.on('data', (chunk) => {
            try {
              const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
              for (const line of lines) {
                console.log('Raw line from stream:', line); // Keep for debugging
                
                if (line.startsWith('data: ')) {
                  const jsonString = line.slice(6);
                  const data = JSON.parse(jsonString); 
                  console.log('Parsed Cohere stream data:', data); // Keep for debugging
                  
                  if (data.type === 'content-delta') {
                    const text = data.delta?.message?.content?.text;
                    if (text) {
                      fullResponse += text;
                      if (onStream) {
                        onStream(text);
                      }
                    }
                  } else if (data.type === 'message-end') {
                    if (onStream) {
                      onStream(''); 
                    }
                    resolve(fullResponse.trim());
                    return; 
                  }
                } else if (line.startsWith('event: ')) {
                  // Ignore event lines, as they don't contain the data payload
                  console.log('Ignoring event line:', line);
                } else {
                  // Log any other unexpected lines
                  console.warn('Unexpected non-JSON, non-event line:', line);
                }
              }
            } catch (error) {
              console.error('Error processing stream chunk:', error);
              // It's possible some non-JSON data comes through, or partial JSON
            }
          });

          response.data.on('end', () => {
            resolve(fullResponse);
          });

          response.data.on('error', (error) => {
            console.error('Stream error:', error);
            reject(error);
          });
        });
      } else {
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
