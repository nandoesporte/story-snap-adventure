
import OpenAI from 'openai';

// Initialize OpenAI client with API key
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Allow usage in browser environment
});

// For development without API keys, we can detect if the API key is valid
export const isOpenAIKeyValid = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return apiKey && apiKey.length > 0 && !apiKey.includes('your-api-key');
};
