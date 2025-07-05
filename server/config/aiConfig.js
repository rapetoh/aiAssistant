import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config'; // or require('dotenv').config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Go up one level from config to server directory
const serverDir = join(__dirname, '..');

const apikey = 'Bearer ' + process.env.API_KEY;

console.log('API_KEY:', process.env.API_KEY);

export const AI_CONFIG = {
  // Default AI provider (can be 'local' or 'openai')
  defaultProvider: 'cohere',
  
  // // Local AI settings (Ollama)
  // local: {
  //   baseUrl: 'http://127.0.0.1:11434',
  //   model: 'gemma3:4b',
  //   temperature: 0.7,
  //   contextSize: 2048
  // },
  
  // OpenAI settings
  cohere: {
    baseUrl: 'https://api.cohere.com/v2/chat',
    enabled: true,
    // Use the raw API key from the environment variable; do NOT include 'Bearer' here
    apiKey: apikey,
    model: 'command-a-03-2025',
    temperature: 0.7,
  }

};
  