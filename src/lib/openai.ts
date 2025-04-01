
import OpenAI from 'openai';
import { toast } from 'sonner';

// Get OpenAI API key from localStorage
const getOpenAIApiKey = () => {
  const key = localStorage.getItem('openai_api_key') || '';
  return key !== 'undefined' && key !== 'null' && key.length > 0 ? key.trim() : '';
};

// Get the selected OpenAI model
const getOpenAIModel = () => {
  const model = localStorage.getItem('openai_model') || 'gpt-4o-mini';
  return model;
};

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

// Caminho para imagens padrão por tema
const getDefaultImagePath = (theme?: string) => {
  const defaultImages: Record<string, string> = {
    'space': '/images/defaults/space.jpg',
    'ocean': '/images/defaults/ocean.jpg',
    'fantasy': '/images/defaults/fantasy.jpg',
    'adventure': '/images/defaults/adventure.jpg',
    'dinosaurs': '/images/defaults/dinosaurs.jpg'
  };
  
  return theme && defaultImages[theme] ? defaultImages[theme] : '/images/defaults/default.jpg';
};

// Generate an image using OpenAI
export const generateImageWithOpenAI = async (prompt: string, size: string = "1024x1024", theme?: string) => {
  let retryCount = 0;
  const maxRetries = 2;
  const timeoutDuration = 30000; // 30 seconds timeout
  
  const generateImage = async (): Promise<string> => {
    try {
      const client = getOpenAIClient();
      if (!client) {
        throw new Error('Cliente OpenAI não inicializado');
      }
      
      console.log(`Gerando imagem com OpenAI: "${prompt.substring(0, 50)}..." (tamanho: ${size})`);
      
      // Create a promise that rejects after a timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), timeoutDuration);
      });
      
      // Create the actual API call promise
      const apiCallPromise = client.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
        quality: "standard",
        response_format: "url",
      });
      
      // Race the API call against the timeout
      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      
      console.log('Imagem gerada com sucesso:', response);
      
      return response.data[0].url;
    } catch (error: any) {
      console.error('Erro ao gerar imagem com OpenAI:', error);
      
      // Check for network errors and retry
      if ((error.message && 
          (error.message.includes('Connection error') || 
           error.message.includes('Failed to fetch') || 
           error.message.includes('Connection timeout'))) && 
          retryCount < maxRetries) {
        retryCount++;
        console.log(`Tentando novamente após erro de conexão (tentativa ${retryCount} de ${maxRetries})...`);
        
        // Aguardar 2 segundos antes de tentar novamente - aumentando o delay para dar tempo à rede
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        return generateImage();
      }
      
      // API error handling with improved user feedback
      if (error.status === 429) {
        toast.error('Limite de requisições da API OpenAI excedido. Tente novamente mais tarde.');
      } else if (error.status === 400) {
        toast.error('Erro na requisição: ' + (error.message || 'Verifique o prompt e tente novamente.'));
      } else if (error.message && error.message.includes('Connection')) {
        toast.error('Erro de conexão com a API OpenAI. Verifique sua conexão de internet.');
        // Dispatch an event to inform components about API issues
        window.dispatchEvent(new CustomEvent('storybot_api_issue'));
        localStorage.setItem("storybot_api_issue", "true");
      } else {
        toast.error('Erro ao gerar imagem: ' + (error.message || 'Tente novamente.'));
      }
      
      // Retornar uma imagem padrão baseada no tema
      const defaultImageUrl = getDefaultImagePath(theme);
      console.log(`Usando imagem padrão devido a erro: ${defaultImageUrl}`);
      
      // Only show this toast if it's not a retry attempt to avoid multiple notifications
      if (retryCount === 0 || retryCount === maxRetries) {
        toast.error(`Erro ao gerar a ilustração. Usando imagem padrão.`);
      }
      
      return defaultImageUrl;
    }
  };
  
  return generateImage();
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
            const client = getOpenAIClient();
            if (!client) {
              throw new Error('Cliente OpenAI não inicializado');
            }
            
            // Use model from parameters, or from localStorage, or default to gpt-4o-mini
            const selectedModel = model || getOpenAIModel() || "gpt-4o-mini";
            console.log(`Usando modelo OpenAI: ${selectedModel}`);
            
            const response = await client.chat.completions.create({
              model: selectedModel,
              messages: messages,
              temperature: temperature || 0.7,
              max_tokens: max_tokens || 1000,
            });
            
            // Clear any previous API issues
            localStorage.removeItem("storybot_api_issue");
            
            return response;
          } catch (error: any) {
            console.error("Error using OpenAI API (attempt " + (retryCount + 1) + "):", error);
            
            // Check specifically for quota errors or connection errors
            if (error.status === 429 || (error.message && error.message.includes('Connection error'))) {
              console.error("Quota or connection error detected:", error);
              localStorage.setItem("storybot_api_issue", "true");
              
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Retrying OpenAI API request with backoff (attempt ${retryCount} of ${maxRetries})...`);
                
                // Wait with exponential backoff before retrying
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                backoffDelay *= 2; // Exponential backoff
                
                return attemptRequest();
              }
            } else {
              // For other errors, increment retry count
              retryCount++;
              if (retryCount <= maxRetries) {
                console.log(`Retrying OpenAI API request (attempt ${retryCount} of ${maxRetries})...`);
                
                // Wait a short time before retrying
                await new Promise(resolve => setTimeout(resolve, 1500));
                return attemptRequest();
              }
            }
            
            // Dispatch an event to inform components about API issues
            window.dispatchEvent(new CustomEvent('storybot_api_issue'));
            localStorage.setItem("storybot_api_issue", "true");
            
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
