import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';
import OpenAI from 'openai';

// Get API key from localStorage or environment variables
const getGeminiApiKey = () => {
  const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  return key !== 'undefined' && key !== 'null' && key.length > 0 ? key.trim() : '';
};

// Get OpenAI API key from localStorage
const getOpenAIApiKey = () => {
  const key = localStorage.getItem('openai_api_key') || '';
  return key !== 'undefined' && key !== 'null' && key.length > 0 ? key.trim() : '';
};

// Initialize Gemini API client with API key
export const geminiAI = new GoogleGenerativeAI(getGeminiApiKey() || 'invalid-key-placeholder');

// Initialize OpenAI with a new API key
export const initializeOpenAI = (apiKey: string) => {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
    console.error('Tentativa de inicializar OpenAI com chave inválida:', apiKey);
    return null;
  }
  
  try {
    console.log(`Inicializando API OpenAI com chave: ${apiKey.substring(0, 5)}...`);
    const trimmedKey = apiKey.trim();
    localStorage.setItem('openai_api_key', trimmedKey);
    
    // Clear any previous API issues
    localStorage.removeItem("storybot_api_issue");
    
    const openaiClient = new OpenAI({ 
      apiKey: trimmedKey,
      dangerouslyAllowBrowser: true
    });
    
    return openaiClient;
  } catch (error) {
    console.error('Erro ao inicializar OpenAI:', error);
    return null;
  }
};

// Get an instance of the OpenAI client
export const getOpenAIClient = () => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    console.error('Chave da API OpenAI não encontrada');
    return null;
  }
  
  try {
    return new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  } catch (error) {
    console.error('Erro ao criar cliente OpenAI:', error);
    return null;
  }
};

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

// Function to set OpenAI API key
export const setOpenAIApiKey = (apiKey: string) => {
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.trim() === '') {
    console.error('Tentativa de salvar chave OpenAI inválida:', apiKey);
    return false;
  }
  
  try {
    console.log(`Salvando chave da API OpenAI: ${apiKey.substring(0, 5)}...`);
    const trimmedKey = apiKey.trim();
    localStorage.setItem('openai_api_key', trimmedKey);
    
    // Test the key by initializing a client
    const client = initializeOpenAI(trimmedKey);
    if (!client) {
      return false;
    }
    
    // Clear any previous API issues
    localStorage.removeItem("storybot_api_issue");
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar chave da OpenAI:', error);
    return false;
  }
};

// Check if the storybot_prompts table exists and create it if it doesn't
export const ensureStoryBotPromptsTable = async () => {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    // Try to execute the SQL from storybot_prompts.sql
    await supabase.rpc('create_storybot_prompt_if_not_exists');
    console.log('StoryBot prompts table checked/created successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring StoryBot prompts table exists:', error);
    return false;
  }
};

// For development without API keys, we can detect if the API key is valid
export const isOpenAIKeyValid = () => {
  const apiKey = getOpenAIApiKey();
  return apiKey && apiKey.length > 0 && apiKey !== 'undefined' && apiKey !== 'null';
};

// Check if OpenAI API key is valid
export const isOpenAIApiKeyValid = () => {
  const apiKey = getOpenAIApiKey();
  return apiKey && apiKey.length > 0 && apiKey !== 'undefined' && apiKey !== 'null';
};

// Generate an image using OpenAI
export const generateImageWithOpenAI = async (prompt: string, size: string = "1024x1024") => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('Cliente OpenAI não inicializado');
    }
    
    console.log(`Gerando imagem com OpenAI: "${prompt.substring(0, 50)}..." (tamanho: ${size})`);
    
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: "standard",
      response_format: "url",
    });
    
    console.log('Imagem gerada com sucesso:', response);
    
    return response.data[0].url;
  } catch (error: any) {
    console.error('Erro ao gerar imagem com OpenAI:', error);
    
    // Check for API errors
    if (error.status === 429) {
      toast.error('Limite de requisições da API OpenAI excedido. Tente novamente mais tarde.');
    } else if (error.status === 400) {
      toast.error('Erro na requisição: ' + (error.message || 'Verifique o prompt e tente novamente.'));
    } else {
      toast.error('Erro ao gerar imagem: ' + (error.message || 'Tente novamente.'));
    }
    
    throw error;
  }
};

// Keep OpenAI interface for backward compatibility
export const openai = {
  chat: {
    completions: {
      create: async ({ messages, model, temperature, max_tokens }: any) => {
        let retryCount = 0;
        const maxRetries = 2;
        let backoffDelay = 2000; // Start with 2 seconds delay
        
        const attemptRequest = async (): Promise<any> => {
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
              // Set a timeout to prevent hanging requests
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

              // Create chat session - not all Gemini models support chat
              const chat = geminiModel.startChat({
                history: geminiMessages.slice(0, -1) // Exclude the last message
              });

              // Generate response
              const lastMessage = geminiMessages[geminiMessages.length - 1];
              const result = await chat.sendMessage(lastMessage.parts[0].text, {
                signal: controller.signal
              });
              
              clearTimeout(timeoutId);
              
              const responseText = result.response.text();

              // Clear any previous API issues
              localStorage.removeItem("storybot_api_issue");

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
            } catch (error: any) {
              // If chat fails, try with direct generation
              console.warn("Chat failed, trying direct content generation:", error);
              
              if (error.name === 'AbortError') {
                throw new Error('Tempo limite excedido ao gerar resposta');
              }
              
              // Check for quota errors
              if (error.message && error.message.includes("quota") && error.message.includes("429")) {
                console.error("Quota exceeded error detected:", error);
                throw new Error('Limite de quota do Gemini excedido. Por favor, tente novamente mais tarde.');
              }
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
              
              const lastMessage = geminiMessages[geminiMessages.length - 1];
              const result = await geminiModel.generateContent(
                lastMessage.parts[0].text,
                { signal: controller.signal }
              );
              
              clearTimeout(timeoutId);
              
              const responseText = result.response.text();
              
              // Clear any previous API issues
              localStorage.removeItem("storybot_api_issue");
              
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
          } catch (error: any) {
            console.error("Error using Gemini API (attempt " + (retryCount + 1) + "):", error);
            
            // Check specifically for quota errors
            if (error.message && (
                error.message.includes("quota") || 
                error.message.includes("429") || 
                error.message.includes("rate limit")
              )) {
              console.error("Quota exceeded or rate limit error detected. Adding delay before retry.");
              localStorage.setItem("storybot_api_issue", "true");
              
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Retrying Gemini API request with backoff (attempt ${retryCount} of ${maxRetries})...`);
                
                // Wait with exponential backoff before retrying
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                backoffDelay *= 2; // Exponential backoff
                
                return attemptRequest();
              }
            } else if (error.message && error.message.includes("Tempo limite excedido")) {
              // Just retry timeout errors without counting towards retry limit
              console.log(`Retrying after timeout error...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return attemptRequest();
            } else {
              // For other errors, increment retry count
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Retrying Gemini API request (attempt ${retryCount} of ${maxRetries})...`);
                
                // Wait a short time before retrying
                await new Promise(resolve => setTimeout(resolve, 1500));
                return attemptRequest();
              }
            }
            
            // Dispatch an event to inform components about API issues
            window.dispatchEvent(new CustomEvent('storybot_api_issue'));
            localStorage.setItem("storybot_api_issue", "true");
            
            // If we've exhausted retries, we can try a local fallback generator
            if (error.message && (
                error.message.includes("quota") || 
                error.message.includes("429") || 
                error.message.includes("rate limit")
              )) {
              // Return a special error that indicates quota issues
              throw new Error('QUOTA_EXCEEDED: ' + error.message);
            }
            
            throw error;
          }
        };
        
        return attemptRequest();
      }
    }
  }
};

// Check if the Leonardo webhook URL is valid
export const isLeonardoWebhookValid = () => {
  const webhookUrl = localStorage.getItem('leonardo_webhook_url');
  return webhookUrl && webhookUrl.length > 0 && webhookUrl.startsWith('http');
};

// Reset Leonardo API status and clear any error flags
export const resetLeonardoApiStatus = () => {
  localStorage.removeItem("leonardo_api_issue");
  return true;
};
