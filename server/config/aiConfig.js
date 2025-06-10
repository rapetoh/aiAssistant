import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Go up one level from config to server directory
const serverDir = join(__dirname, '..');

export const AI_CONFIG = {
  // Default AI provider (can be 'local' or 'openai')
  defaultProvider: 'openai',
  
  // Local AI settings (Ollama)
  local: {
    baseUrl: 'http://127.0.0.1:11434',
    model: 'gemma3:4b',
    temperature: 0.7,
    contextSize: 2048
  },
  
  // OpenAI settings
  openai: {
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    enabled: true,
    apiKey: '	Bearer REMOVED', // Replace this with your actual OpenAI API key
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    temperature: 0.7,
  }

};
  