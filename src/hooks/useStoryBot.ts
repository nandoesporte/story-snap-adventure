import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { StoryBot } from "@/services/StoryBot";
import { LeonardoAIAgent } from "@/services/LeonardoAIAgent";
import { ensureStoryBotPromptsTable, resetLeonardoApiStatus as resetLeonardoApi } from "@/lib/openai";

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
  
  const storyBot = new StoryBot();
  const leonardoAgent = new LeonardoAIAgent();
  
  useEffect(() => {
    ensureStoryBotPromptsTable().catch(err => {
      console.warn('Failed to ensure StoryBot prompts table exists:', err);
    });
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
    moralTheme: string = ""
  ) => {
    try {
      return await storyBot.generateImageDescription(
        pageText,
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
    characterPrompt: string | null = null
  ) => {
    try {
      console.log("Usando LeonardoAIAgent para gerar imagem consistente");
      
      return await leonardoAgent.generateImage({
        prompt: imageDescription,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImage: childImageBase64
      });
    } catch (error) {
      console.error("Error generating image:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
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
      
      return await leonardoAgent.generateImage({
        prompt: `Capa de livro infantil para "${title}" com ${characterName} em uma aventura no cenário de ${setting} com tema de ${theme}.`,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImage: childImageBase64
      });
    } catch (error) {
      console.error("Error generating cover image:", error);
      setApiAvailable(false);
      window.dispatchEvent(new CustomEvent("storybot_api_issue"));
      localStorage.setItem("storybot_api_issue", "true");
      
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
    childImageBase64: string | null = null
  ) => {
    toast.info("Gerando ilustrações consistentes para a história...");
    
    try {
      const imageUrls = await leonardoAgent.generateStoryImages(
        storyPages,
        characterName,
        theme,
        setting,
        characterPrompt,
        style,
        childImageBase64
      );
      
      console.log("Imagens geradas com sucesso:", imageUrls);
      return imageUrls;
    } catch (error) {
      console.error("Erro ao gerar ilustrações consistentes:", error);
      toast.error("Erro ao gerar ilustrações. Usando imagens de placeholder.");
      
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

  const setLeonardoWebhook = (url: string) => {
    return true;
  };

  const resetLeonardoApiStatus = () => {
    resetLeonardoApi();
    setLeonardoApiAvailable(true);
    
    localStorage.removeItem("leonardo_api_issue");
    
    toast.success("Status da API do Leonardo foi redefinido. Tente gerar imagens novamente.");
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
    resetLeonardoApiStatus,
    setLeonardoWebhook,
    leonardoWebhookUrl: null,
    leonardoAgent
  };
};
