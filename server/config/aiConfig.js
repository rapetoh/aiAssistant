import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Go up one level from config to server directory
const serverDir = join(__dirname, '..');

export const AI_CONFIG = {
  // Default AI provider (can be 'local' or 'openai')
  defaultProvider: 'openai',
  
  // Local AI settings (Llama)
  local: {
    modelPath: join(serverDir, 'models', 'llama-2-7b-chat.Q8_0.gguf'),
    contextSize: 2048,
    batchSize: 512,
    threads: 4,
    temperature: 0.7
  },
  
  // OpenAI settings
  openai: {
    enabled: true,
    apiKey: 'REMOVEDproj-oCRk9Ri7HsFIL28_JjrvVO4qhFfokS-Jxs2Sc8LFKj8wK6MOHz5-5IomIrEN0DZMy-M93XTN4XT3BlbkFJmfhbWFPHCn72tYmr1Ha1gD7A63iL1CU_jGD0JYtv7aToIxAMORgGvhZSNKjv4M-4lx_E8dVcYA', // Replace this with your actual OpenAI API key
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
  }
};
  