
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from localStorage or environment variables
const getGeminiApiKey = () => {
  const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  return key !== 'undefined' && key !== 'null' && key.length > 0 ? key.trim() : '';
};

// Initialize Gemini API client with API key
export const geminiAI = new GoogleGenerativeAI(getGeminiApiKey() || 'invalid-key-placeholder');

// Function to reinitialize Gemini with a new API key
export const reinitializeGeminiAI = (apiKey: string) => {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
    console.error('Tentativa de inicializar Gemini com chave inválida:', apiKey);
    return null;
  }
  
  try {
    console.log(`Inicializando API Gemini com chave: ${apiKey.substring(0, 5)}...`);
    const trimmedKey = apiKey.trim();
    localStorage.setItem('gemini_api_key', trimmedKey);
    
    // Clear any previous API issues
    localStorage.removeItem("storybot_api_issue");
    
    const newClient = new GoogleGenerativeAI(trimmedKey);
    return newClient;
  } catch (error) {
    console.error('Erro ao reinicializar Gemini:', error);
    return null;
  }
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

          // Always use gemini-1.5-pro model
          const geminiModel = currentGeminiAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: {
              temperature: temperature || 0.7,
              maxOutputTokens: max_tokens || 1000,
            }
          });

          try {
            // Create chat session - not all Gemini models support chat
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
            // If chat fails, try with direct generation
            console.warn("Chat failed, trying direct content generation:", error);
            
            const lastMessage = geminiMessages[geminiMessages.length - 1];
            const result = await geminiModel.generateContent(lastMessage.parts[0].text);
            const responseText = result.response.text();
            
            return {
              choices: [
                {
                  message: {
                    content: responseText
                  }
                }
              ]
            };
          }
        } catch (error) {
          console.error("Error using Gemini API:", error);
          // Dispatch an event to inform components about API issues
          window.dispatchEvent(new CustomEvent('storybot_api_issue'));
          localStorage.setItem('storybot_api_issue', 'true');
          throw error;
        }
      }
    }
  }
};

// For development without API keys, we can detect if the API key is valid
export const isOpenAIKeyValid = () => {
  const apiKey = getGeminiApiKey();
  return apiKey && apiKey.length > 0 && apiKey !== 'undefined' && apiKey !== 'null';
};
