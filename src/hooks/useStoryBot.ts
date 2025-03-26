import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { StoryBot } from "@/services/StoryBot";
import { LeonardoAIAgent } from "@/services/LeonardoAIAgent";
import { 
  ensureStoryBotPromptsTable, 
  resetLeonardoApiStatus as resetLeonardoApi, 
  isOpenAIApiKeyValid,
  initializeOpenAI
} from "@/lib/openai";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const useStoryBot = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [leonardoApiAvailable, setLeonardoApiAvailable] = useState(true);
  const [leonardoWebhookUrl, setLeonardoWebhookUrl] = useState<string | null>(null);
  const [useOpenAIForStories, setUseOpenAIForStoriesState] = useState<boolean>(false);
  const [openAIModel, setOpenAIModel] = useState<'gpt-4o' | 'gpt-4o-mini'>('gpt-4o-mini');
  
  const storyBot = new StoryBot();
  const leonardoAgent = new LeonardoAIAgent();
  
  useEffect(() => {
    ensureStoryBotPromptsTable().catch(err => {
      console.warn('Failed to ensure StoryBot prompts table exists:', err);
    });
    
    const savedWebhookUrl = localStorage.getItem('leonardo_webhook_url');
    if (savedWebhookUrl) {
      setLeonardoWebhookUrl(savedWebhookUrl);
    }
    
    const useOpenAI = localStorage.getItem('use_openai_for_stories') === 'true';
    const savedOpenAIModel = localStorage.getItem('openai_model') as 'gpt-4o' | 'gpt-4o-mini' || 'gpt-4o-mini';
    
    setUseOpenAIForStoriesState(useOpenAI);
    setOpenAIModel(savedOpenAIModel);
    
    storyBot.setUseOpenAI(useOpenAI, savedOpenAIModel);
  }, []);
  
  useEffect(() => {
    setApiAvailable(storyBot.isApiAvailable());
    setLeonardoApiAvailable(leonardoAgent.isAgentAvailable());
    
    const handleStoryBotApiIssue = () => {
      setApiAvailable(false);
    };
    
    const handleLeonardoApiIssue = () => {
      setLeonardoApiAvailable(false);
    };
    
    window.addEventListener('storybot_api_issue', handleStoryBotApiIssue);
    window.addEventListener('leonardo_api_issue', handleLeonardoApiIssue);
    
    return () => {
      window.removeEventListener('storybot_api_issue', handleStoryBotApiIssue);
      window.removeEventListener('leonardo_api_issue', handleLeonardoApiIssue);
    };
  }, []);

  const generateStoryBotResponse = async (messages: Message[], userPrompt: string) => {
    setIsGenerating(true);
    
    try {
      const response = await storyBot.generateStoryBotResponse(messages, userPrompt);
      setRetryCount(0);
      setApiAvailable(storyBot.isApiAvailable());
      return response;
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      const fallbackResponses = [
        "Peço desculpas, estou com dificuldades técnicas no momento. Estou usando um gerador local de histórias para continuar te ajudando. Poderia tentar novamente com outras palavras?",
        "Estou tendo problemas para acessar minha base de conhecimento completa, mas posso continuar te ajudando com o gerador local de histórias. Vamos tentar algo diferente?",
        "Parece que houve um problema na conexão. Estou trabalhando com recursos limitados agora, mas ainda posso criar histórias legais para você. Poderia reformular sua pergunta?"
      ];
      
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImageDescription = async (
    pageText: string,
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string | null = null
  ) => {
    try {
      // Adicionar detalhes do personagem se disponíveis
      let enrichedText = pageText;
      if (characterPrompt) {
        enrichedText += ` (O personagem ${characterName} possui as seguintes características: ${characterPrompt})`;
      }
      
      return await storyBot.generateImageDescription(
        enrichedText,
        characterName,
        childAge,
        theme,
        setting,
        moralTheme
      );
    } catch (error) {
      console.error("Error generating image description:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
      return `Ilustração detalhada de ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
    }
  };
  
  const generateImage = async (
    imageDescription: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null,
    style: string = "cartoon",
    characterPrompt: string | null = null,
    storyContext: string | null = null
  ) => {
    try {
      console.log("Using LeonardoAIAgent to generate consistent image");
      
      let enhancedPrompt = imageDescription;
      if (characterPrompt) {
        enhancedPrompt += `. O personagem ${characterName} possui as seguintes características: ${characterPrompt}`;
        console.log("Enhanced prompt with character details");
      }
      
      const imageUrl = await leonardoAgent.generateImage({
        prompt: enhancedPrompt,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImage: childImageBase64,
        storyContext: storyContext
      });
      
      console.log("Generated image URL:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error generating image:", error);
      setLeonardoApiAvailable(false);
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      
      toast.error("Erro ao gerar imagem. Usando imagens de placeholder.");
      
      const themeImages: {[key: string]: string} = {
        adventure: "/images/placeholders/adventure.jpg",
        fantasy: "/images/placeholders/fantasy.jpg",
        space: "/images/placeholders/space.jpg",
        ocean: "/images/placeholders/ocean.jpg",
        dinosaurs: "/images/placeholders/dinosaurs.jpg"
      };
      
      return themeImages[theme as keyof typeof themeImages] || "/placeholder.svg";
    }
  };
  
  const generateCoverImage = async (
    title: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ) => {
    try {
      console.log("Using LeonardoAIAgent for cover image generation");
      
      let coverPrompt = `Capa de livro infantil para "${title}" com ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`;
      
      if (characterPrompt) {
        coverPrompt += ` O personagem ${characterName} possui as seguintes características: ${characterPrompt}`;
        console.log("Enhanced cover prompt with character details");
      }
      
      const imageUrl = await leonardoAgent.generateImage({
        prompt: coverPrompt,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImage: childImageBase64,
        storyContext: `Capa do livro "${title}"`
      });
      
      console.log("Generated cover image URL:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error generating cover image:", error);
      setLeonardoApiAvailable(false);
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      
      const themeCovers: {[key: string]: string} = {
        adventure: "/images/covers/adventure.jpg",
        fantasy: "/images/covers/fantasy.jpg",
        space: "/images/covers/space.jpg",
        ocean: "/images/covers/ocean.jpg",
        dinosaurs: "/images/covers/dinosaurs.jpg"
      };
      
      return themeCovers[theme as keyof typeof themeCovers] || `/placeholder.svg`;
    }
  };

  const generateConsistentStoryImages = async (
    storyPages: string[],
    characterName: string,
    theme: string,
    setting: string,
    characterPrompt: string | null = null,
    style: string = "cartoon",
    childImageBase64: string | null = null,
    storyTitle: string | null = null
  ) => {
    toast.info("Gerando ilustrações consistentes para a história...");
    
    try {
      console.log("Generating consistent story images with params:", {
        storyPages: storyPages.length,
        characterName,
        theme,
        setting,
        characterPrompt: characterPrompt?.substring(0, 50) + "...",
        style,
        hasChildImage: !!childImageBase64,
        storyTitle,
        useOpenAIForStories
      });
      
      const enhancedStoryPages = storyPages.map((page, index) => {
        let enhancedPage = page;
        
        if (characterPrompt) {
          enhancedPage = `${page} (Personagem ${characterName}: ${characterPrompt})`;
        }
        
        enhancedPage = `Página ${index + 1} de uma história infantil: ${enhancedPage}`;
        
        enhancedPage += ` Ilustre o momento principal desta cena em estilo de ${style === 'cartoon' ? 'desenho animado colorido' : style}.`;
        
        return enhancedPage;
      });
      
      const imageUrls = await leonardoAgent.generateStoryImages(
        enhancedStoryPages,
        characterName,
        theme,
        setting,
        characterPrompt,
        style,
        childImageBase64,
        storyTitle
      );
      
      console.log("Successfully generated story images:", imageUrls);
      return imageUrls;
    } catch (error) {
      console.error("Error generating consistent illustrations:", error);
      toast.error("Erro ao gerar ilustrações. Usando imagens de placeholder.");
      
      setLeonardoApiAvailable(false);
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      
      return storyPages.map(() => {
        const themeImages: {[key: string]: string} = {
          adventure: "/images/placeholders/adventure.jpg",
          fantasy: "/images/placeholders/fantasy.jpg",
          space: "/images/placeholders/space.jpg",
          ocean: "/images/placeholders/ocean.jpg",
          dinosaurs: "/images/placeholders/dinosaurs.jpg"
        };
        
        return themeImages[theme as keyof typeof themeImages] || "/placeholder.svg";
      });
    }
  };
  
  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      toast.error("Erro ao processar imagem.");
      return "";
    }
  };

  const resetLeonardoApiStatus = () => {
    resetLeonardoApi();
    setLeonardoApiAvailable(true);
    
    localStorage.removeItem("leonardo_api_issue");
    
    toast.success("Status da API do Leonardo foi redefinido. Tente gerar imagens novamente.");
  };
  
  const setLeonardoApiKey = (apiKey: string): boolean => {
    if (!apiKey) return false;
    
    try {
      const success = leonardoAgent.setApiKey(apiKey);
      if (success) {
        setLeonardoApiAvailable(true);
        localStorage.removeItem("leonardo_api_issue");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error setting Leonardo API key:", error);
      return false;
    }
  };

  const updateLeonardoWebhookUrl = (url: string): boolean => {
    if (!url) return false;
    
    try {
      localStorage.setItem('leonardo_webhook_url', url);
      setLeonardoWebhookUrl(url);
      return true;
    } catch (error) {
      console.error("Error setting Leonardo webhook URL:", error);
      return false;
    }
  };

  const setUseOpenAIForStories = (useOpenAI: boolean, model: 'gpt-4o' | 'gpt-4o-mini' = 'gpt-4o-mini'): boolean => {
    try {
      localStorage.setItem('use_openai_for_stories', useOpenAI.toString());
      localStorage.setItem('openai_model', model);
      
      setUseOpenAIForStoriesState(useOpenAI);
      setOpenAIModel(model);
      
      storyBot.setUseOpenAI(useOpenAI, model);
      
      console.log(`Configurado para usar ${useOpenAI ? `OpenAI ${model}` : 'Gemini'} para geração de histórias`);
      
      return true;
    } catch (error) {
      console.error("Error setting OpenAI usage preference:", error);
      return false;
    }
  };

  const checkOpenAIAvailability = (): boolean => {
    return isOpenAIApiKeyValid();
  };

  const initializeOpenAIClient = (apiKey: string) => {
    return initializeOpenAI(apiKey);
  };

  return { 
    generateStoryBotResponse, 
    isGenerating,
    generateImageDescription,
    generateImage,
    generateCoverImage,
    generateConsistentStoryImages,
    convertImageToBase64,
    apiAvailable,
    leonardoApiAvailable,
    leonardoWebhookUrl,
    resetLeonardoApiStatus,
    setLeonardoApiKey,
    updateLeonardoWebhookUrl,
    leonardoAgent,
    useOpenAIForStories,
    openAIModel,
    setUseOpenAIForStories,
    checkOpenAIAvailability,
    initializeOpenAIClient
  };
};
