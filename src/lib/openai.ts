import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from localStorage or environment variables
const getGeminiApiKey = () => {
  return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

// Initialize Gemini API client with API key
export const geminiAI = new GoogleGenerativeAI(getGeminiApiKey());

// Function to reinitialize Gemini with a new API key
export const reinitializeGeminiAI = (apiKey: string) => {
  localStorage.setItem('gemini_api_key', apiKey);
  return new GoogleGenerativeAI(apiKey);
};

// Keep OpenAI interface for backward compatibility
export const openai = {
  chat: {
    completions: {
      create: async ({ messages, model, temperature, max_tokens }: any) => {
        try {
          // Get current API key
          const currentApiKey = getGeminiApiKey();
          if (!currentApiKey) {
            throw new Error('Chave da API Gemini não configurada');
          }
          
          // Create a new instance with the current key
          const currentGeminiAI = new GoogleGenerativeAI(currentApiKey);
          
          // Map OpenAI messages format to Gemini format
          const geminiMessages = messages.map((msg: any) => ({
            role: msg.role === 'assistant' ? 'model' : msg.role,
            parts: [{ text: msg.content }]
          }));

          // Get appropriate model from Gemini
          const modelName = model.includes('gpt-4') ? 'gemini-pro' : 'gemini-1.0-pro';
          const geminiModel = currentGeminiAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
              temperature: temperature || 0.7,
              maxOutputTokens: max_tokens || 1000,
            }
          });

          // Create chat session
          const chat = geminiModel.startChat({
            history: geminiMessages.slice(0, -1) // Exclude the last message
          });

          // Generate response
          const lastMessage = geminiMessages[geminiMessages.length - 1];
          const result = await chat.sendMessage(lastMessage.parts[0].text);
          const responseText = result.response.text();

          // Format response to match OpenAI structure
          return {
            choices: [
              {
                message: {
                  content: responseText
                }
              }
            ]
          };
        } catch (error) {
          console.error("Error using Gemini API:", error);
          throw error;
        }
      }
    }
  }
};

// For development without API keys, we can detect if the API key is valid
export const isOpenAIKeyValid = () => {
  const apiKey = getGeminiApiKey();
  return apiKey && apiKey.length > 0 && !apiKey.includes('your-api-key');
};
