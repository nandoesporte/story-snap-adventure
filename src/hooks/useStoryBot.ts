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
  initializeOpenAI,
  generateImageWithOpenAI
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
  const [useOpenAIForStories, setUseOpenAIForStoriesState] = useState<boolean>(false);
  const [openAIModel, setOpenAIModel] = useState<'gpt-4o' | 'gpt-4o-mini'>('gpt-4o-mini');
  
  const storyBot = new StoryBot();
  const leonardoAgent = new LeonardoAIAgent();
  
  useEffect(() => {
    ensureStoryBotPromptsTable().catch(err => {
      console.warn('Failed to ensure StoryBot prompts table exists:', err);
    });
    
    const useOpenAI = localStorage.getItem('use_openai_for_stories') === 'true';
    const savedOpenAIModel = localStorage.getItem('openai_model') as 'gpt-4o' | 'gpt-4o-mini' || 'gpt-4o-mini';
    
    setUseOpenAIForStoriesState(useOpenAI);
    setOpenAIModel(savedOpenAIModel);
    
    storyBot.setUseOpenAI(useOpenAI, savedOpenAIModel);
    
    const leonardoApiKey = localStorage.getItem('leonardo_api_key');
    setLeonardoApiAvailable(!!leonardoApiKey && leonardoApiKey.length > 10);
    
    if (leonardoApiKey && leonardoApiKey.length > 10) {
      localStorage.removeItem("leonardo_api_issue");
    }
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
      console.log("Generating image with prompt:", imageDescription.substring(0, 100) + "...");
      console.log("Image generation params:", { characterName, theme, setting, style, hasChildImage: !!childImageBase64 });
      
      if (useOpenAIForStories && isOpenAIApiKeyValid()) {
        console.log("Using OpenAI for image generation");
        
        let enhancedPrompt = `${style} style illustration for a children's book showing ${characterName} in ${setting} with ${theme} theme. `;
        enhancedPrompt += imageDescription;
        
        if (characterPrompt) {
          enhancedPrompt += ` Character details: ${characterPrompt}`;
        }
        
        try {
          const imageUrl = await generateImageWithOpenAI(enhancedPrompt);
          console.log("Generated image URL with OpenAI:", imageUrl);
          return imageUrl;
        } catch (error) {
          console.error("OpenAI image generation failed, falling back to Leonardo:", error);
          toast.error("Erro na geração com OpenAI. Tentando com Leonardo.ai...");
        }
      }
      
      const leonardoApiKey = localStorage.getItem('leonardo_api_key');
      if (!leonardoApiKey || leonardoApiKey.length < 10) {
        console.warn("No valid Leonardo API key found, using placeholder image");
        toast.warning("Chave da API Leonardo não configurada. Usando imagem de placeholder.");
        return getFallbackImage(theme);
      }
      
      console.log("Using LeonardoAIAgent to generate image");
      leonardoAgent.setApiKey(leonardoApiKey);
      
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
      
      console.log("Generated image URL with Leonardo:", imageUrl);
      return imageUrl;
    } catch (error) {
      console.error("Error generating image:", error);
      setLeonardoApiAvailable(false);
      window.dispatchEvent(new CustomEvent("leonardo_api_issue"));
      localStorage.setItem("leonardo_api_issue", "true");
      
      toast.error("Erro ao gerar imagem. Usando imagens de placeholder.");
      
      return getFallbackImage(theme);
    }
  };

  const getFallbackImage = (theme: string): string => {
    const themeImages: {[key: string]: string} = {
      adventure: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      fantasy: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      space: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      ocean: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
      dinosaurs: "https://images.unsplash.com/photo-1472396961693-142e6e269027"
    };
    
    return themeImages[theme as keyof typeof themeImages] || "https://images.unsplash.com/photo-1472396961693-142e6e269027";
  };

  const generateCoverImage = async (
    title: string,
    characterName: string,
    theme: string,
    setting: string,
    childImageBase64: string | null = null,
    style: string = "cartoon",
    characterPrompt: string | null = null
  ) => {
    try {
      if (useOpenAIForStories && isOpenAIApiKeyValid()) {
        console.log("Using OpenAI for cover image generation");
        
        let coverPrompt = `Book cover illustration in ${style} style for a children's book titled "${title}". `;
        coverPrompt += `The main character ${characterName} in a ${setting} setting with ${theme} theme. `;
        
        if (characterPrompt) {
          coverPrompt += `Character details: ${characterPrompt}. `;
        }
        
        coverPrompt += "Create a captivating, colorful illustration suitable for a book cover.";
        
        try {
          const imageUrl = await generateImageWithOpenAI(coverPrompt, "1792x1024");
          console.log("Generated cover image URL with OpenAI:", imageUrl);
          return imageUrl;
        } catch (error) {
          console.error("OpenAI cover image generation failed, falling back to Leonardo:", error);
          toast.error("Erro na geração da capa com OpenAI. Tentando com Leonardo.ai...");
        }
      }
      
      console.log("Using LeonardoAIAgent for cover image generation");
      
      const imageUrl = await leonardoAgent.generateCoverImage(
        title,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImageBase64
      );
      
      console.log("Generated cover image URL with Leonardo:", imageUrl);
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
    imagePrompts: string[],
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
        imagePrompts: imagePrompts.length,
        characterName,
        theme,
        setting,
        characterPrompt: characterPrompt?.substring(0, 50) + "...",
        style,
        hasChildImage: !!childImageBase64,
        storyTitle,
        useOpenAIForStories
      });
      
      const leonardoApiKey = localStorage.getItem('leonardo_api_key');
      if (!leonardoApiKey || leonardoApiKey.length < 10) {
        console.warn("No valid Leonardo API key found, using placeholder images");
        toast.warning("Chave da API Leonardo não configurada. Usando imagens de placeholder.");
        return storyPages.map(() => getFallbackImage(theme));
      }
      
      if (useOpenAIForStories && isOpenAIApiKeyValid()) {
        console.log("Using OpenAI for consistent story images");
        
        const imageUrls: string[] = [];
        
        const characterReferencePrompt = `Clear reference image of the character ${characterName} in ${style} style. ` +
          `${characterPrompt || ''}`;
        
        try {
          for (let i = 0; i < imagePrompts.length; i++) {
            const pagePrompt = imagePrompts[i];
            const enhancedPrompt = `${style} style illustration for a children's book. ` +
              `Scene: ${pagePrompt} ` +
              `The main character ${characterName} should be consistent throughout the book. ` +
              `Setting: ${setting}. Theme: ${theme}. ` +
              (characterPrompt ? `Character details: ${characterPrompt}.` : '');
            
            toast.info(`Gerando ilustração ${i+1} de ${imagePrompts.length}...`);
            
            const imageUrl = await generateImageWithOpenAI(enhancedPrompt);
            imageUrls.push(imageUrl);
          }
          
          return imageUrls;
        } catch (error) {
          console.error("OpenAI image generation failed, falling back to Leonardo:", error);
          toast.error("Erro na geração de imagens com OpenAI. Tentando com Leonardo.ai...");
        }
      }
      
      leonardoAgent.setApiKey(leonardoApiKey);
      
      const imageUrls = await leonardoAgent.generateStoryImages(
        storyPages,
        imagePrompts,
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
      
      return storyPages.map(() => getFallbackImage(theme));
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

  const generateCompleteStory = async (
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    pageCount: number | string,
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    childImageBase64: string | null = null,
    style: string = "papercraft"
  ): Promise<{ title: string; coverImageUrl: string; pages: Array<{ text: string; imageUrl: string }> }> => {
    try {
      const exactPageCount = typeof pageCount === 'string' 
        ? parseInt(pageCount, 10) || 5 
        : pageCount;
        
      console.log(`Generating complete story with ${exactPageCount} pages`);
      
      toast.info("Iniciando geração da história completa...");
      
      setIsGenerating(true);
      
      toast.info("Criando a narrativa da história...");
      const storyData = await storyBot.generateStoryWithPrompts(
        characterName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt,
        exactPageCount.toString(),
        readingLevel,
        language
      );
      
      console.log("Generated story:", {
        title: storyData.title,
        pages: storyData.content.length,
        imagePrompts: storyData.imagePrompts.length
      });
      
      const leonardoApiKey = localStorage.getItem('leonardo_api_key');
      let coverImageUrl;
      
      toast.info("Criando a capa do livro...");
      
      if (useOpenAIForStories && isOpenAIApiKeyValid()) {
        try {
          const coverPrompt = `Book cover illustration in ${style} style for a children's book titled "${storyData.title}". ` +
            `The main character ${characterName} in a ${setting} setting with ${theme} theme. ` +
            (characterPrompt ? `Character details: ${characterPrompt}. ` : '') +
            "Create a captivating, colorful illustration suitable for a book cover.";
          
          coverImageUrl = await generateImageWithOpenAI(coverPrompt, "1792x1024");
        } catch (error) {
          console.error("Failed to generate cover with OpenAI, attempting with Leonardo:", error);
          
          if (leonardoApiKey && leonardoApiKey.length > 10) {
            coverImageUrl = await leonardoAgent.generateCoverImage(
              storyData.title,
              characterName,
              theme,
              setting,
              style,
              characterPrompt,
              childImageBase64
            );
          } else {
            const themeCovers: {[key: string]: string} = {
              adventure: "/images/covers/adventure.jpg",
              fantasy: "/images/covers/fantasy.jpg",
              space: "/images/covers/space.jpg",
              ocean: "/images/covers/ocean.jpg",
              dinosaurs: "/images/covers/dinosaurs.jpg"
            };
            
            coverImageUrl = themeCovers[theme as keyof typeof themeCovers] || "/images/covers/adventure.jpg";
          }
        }
      } else if (leonardoApiKey && leonardoApiKey.length > 10) {
        coverImageUrl = await leonardoAgent.generateCoverImage(
          storyData.title,
          characterName,
          theme,
          setting,
          style,
          characterPrompt,
          childImageBase64
        );
      } else {
        const themeCovers: {[key: string]: string} = {
          adventure: "/images/covers/adventure.jpg",
          fantasy: "/images/covers/fantasy.jpg",
          space: "/images/covers/space.jpg",
          ocean: "/images/covers/ocean.jpg",
          dinosaurs: "/images/covers/dinosaurs.jpg"
        };
        
        coverImageUrl = themeCovers[theme as keyof typeof themeCovers] || "/images/covers/adventure.jpg";
      }
      
      toast.info(`Criando ilustrações para ${storyData.content.length} páginas...`);
      
      let imageUrls;
      if (useOpenAIForStories && isOpenAIApiKeyValid()) {
        try {
          imageUrls = await generateConsistentStoryImages(
            storyData.content,
            storyData.imagePrompts,
            characterName,
            theme,
            setting,
            characterPrompt,
            style,
            childImageBase64,
            storyData.title
          );
        } catch (error) {
          console.error("OpenAI image generation failed, using placeholders:", error);
          imageUrls = storyData.content.map(() => getFallbackImage(theme));
        }
      } else if (leonardoApiKey && leonardoApiKey.length > 10) {
        imageUrls = await leonardoAgent.generateStoryImages(
          storyData.content,
          storyData.imagePrompts,
          characterName,
          theme,
          setting,
          characterPrompt,
          style,
          childImageBase64,
          storyData.title
        );
      } else {
        toast.warning("Chave da API Leonardo não configurada. Usando imagens de placeholder.");
        imageUrls = storyData.content.map(() => getFallbackImage(theme));
      }
      
      const completeBook = {
        title: storyData.title,
        coverImageUrl,
        childName: characterName,
        childAge,
        theme,
        setting,
        characterPrompt,
        pages: storyData.content.map((text, index) => ({
          text,
          imageUrl: imageUrls[index] || getFallbackImage(theme)
        }))
      };
      
      toast.success("História gerada com sucesso!");
      
      return completeBook;
    } catch (error) {
      console.error("Error generating complete story:", error);
      toast.error("Erro ao gerar a história completa. Por favor, tente novamente.");
      throw error;
    } finally {
      setIsGenerating(false);
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
    resetLeonardoApiStatus,
    setLeonardoApiKey,
    leonardoAgent,
    useOpenAIForStories,
    openAIModel,
    setUseOpenAIForStories,
    checkOpenAIAvailability,
    initializeOpenAIClient,
    generateCompleteStory,
    generateImageWithOpenAI
  };
};
