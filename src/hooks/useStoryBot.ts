
import { useState, useEffect } from 'react';
import { StoryBot } from '@/services/StoryBot';
import { generateImageWithOpenAI } from '@/lib/openai';
import { toast } from 'sonner';
import { LeonardoAIAgent } from '@/services/LeonardoAIAgent';
// Import the imageStorage directly instead of dynamically
import { saveImagePermanently, saveStoryImagesPermanently } from '@/lib/imageStorage';

// Create singleton instances of the AI agents
const storyBot = new StoryBot();
const leonardoAgent = new LeonardoAIAgent();

export const useStoryBot = () => {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [leonardoApiAvailable, setLeonardoApiAvailable] = useState<boolean>(false);
  const [useOpenAIForStories, setUseOpenAIFlag] = useState<boolean>(true);
  const [openAIModel, setOpenAIModel] = useState<string>('gpt-4o-mini');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [useOpenAIForImages, setUseOpenAIForImages] = useState<boolean>(false);
  const [useLeonardoAI, setUseLeonardoAI] = useState<boolean>(true);
  
  useEffect(() => {
    const isApiAvailable = storyBot.isApiAvailable();
    setApiAvailable(isApiAvailable);
    
    const isLeonardoApiAvailable = leonardoAgent.isAgentAvailable();
    setLeonardoApiAvailable(isLeonardoApiAvailable);
    
    // Load saved model
    const savedModel = localStorage.getItem('openai_model');
    if (savedModel) {
      setOpenAIModel(savedModel);
    }
    
    // Load image generation preferences but enforce Leonardo as default if available
    const savedUseLeonardo = localStorage.getItem('use_leonardo_ai') !== 'false';
    const savedUseOpenAIForImages = localStorage.getItem('use_openai_for_images') === 'true';
    
    setUseLeonardoAI(savedUseLeonardo);
    setUseOpenAIForImages(savedUseOpenAIForImages);
  }, []);

  const generateStoryBotResponse = async (messages: any[], userPrompt: string) => {
    if (!apiAvailable) {
      throw new Error('API indisponível');
    }
    
    setIsGenerating(true);
    
    try {
      return await storyBot.generateStoryBotResponse(messages, userPrompt);
    } catch (error) {
      console.error("Error generating StoryBot response:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  const checkOpenAIAvailability = async () => {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('openai_api_key')}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setApiAvailable(true);
        return true;
      } else {
        console.error("OpenAI API check failed:", await response.text());
        setApiAvailable(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking OpenAI availability:", error);
      setApiAvailable(false);
      return false;
    }
  };
  
  const setUseOpenAIForStories = (useOpenAI: boolean, model: string = 'gpt-4o-mini') => {
    storyBot.setUseOpenAI(useOpenAI, model);
    setUseOpenAIFlag(useOpenAI);
    setOpenAIModel(model);
    localStorage.setItem('openai_model', model);
  };
  
  const setPromptById = async (promptId: string) => {
    return await storyBot.setPromptById(promptId);
  };
  
  const loadPromptByName = async (promptName: string) => {
    return await storyBot.loadPromptByName(promptName);
  };
  
  const listAvailablePrompts = async () => {
    return await storyBot.listAvailablePrompts();
  };
  
  const getPromptReferenceImages = async (promptId: string) => {
    return await storyBot.getPromptReferenceImages(promptId);
  };
  
  const resetLeonardoApiStatus = () => {
    localStorage.removeItem('leonardo_webhook_url');
    localStorage.removeItem('leonardo_api_key');
    localStorage.removeItem('leonardo_api_issue');
    setLeonardoApiAvailable(false);
    toast.success("API status reset successfully");
  };
  
  const setLeonardoApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }
    
    try {
      localStorage.setItem('leonardo_api_key', apiKey.trim());
      localStorage.setItem('leonardo_webhook_url', 'https://cloud.leonardo.ai/api/rest/v1/generations');
      setLeonardoApiAvailable(true);
      return true;
    } catch (error) {
      console.error("Error setting Leonardo API key:", error);
      return false;
    }
  };
  
  const generateImage = async (prompt: string, size: string = "1024x1024") => {
    try {
      console.log("Priority: Using Leonardo AI for image generation");
      
      // Always try Leonardo first if available
      if (leonardoApiAvailable) {
        try {
          console.log("Generating image with Leonardo AI:", prompt.substring(0, 100));
          const result = await leonardoAgent.generateImage({
            prompt,
            characterName: "",
            theme: "",
            setting: "",
            style: "papercraft"
          });
          console.log("Successfully generated image with Leonardo AI");
          return result;
        } catch (error) {
          console.error("Leonardo AI image generation failed:", error);
          toast.error("Falha na geração com Leonardo AI. Tentando com OpenAI...");
          
          // Fall back to OpenAI if Leonardo fails and OpenAI is enabled
          if (useOpenAIForImages) {
            console.log("Falling back to OpenAI for image generation");
            return generateImageWithOpenAI(prompt, size);
          }
          throw new Error("Leonardo AI falhou e OpenAI não está habilitado para geração de imagens");
        }
      } else if (useOpenAIForImages) {
        // Only use OpenAI if Leonardo is not available and OpenAI is enabled
        console.log("Leonardo AI não disponível. Usando OpenAI para geração de imagens");
        return generateImageWithOpenAI(prompt, size);
      } else {
        throw new Error("Nenhum serviço de geração de imagem está disponível");
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast.error(`Erro na geração de imagem: ${error.message || "Erro desconhecido"}`);
      throw error;
    }
  };
  
  const generateCompleteStory = async (
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    pageCount: number = 5,
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    childImageBase64: string | null = null,
    style: string = "papercraft"
  ) => {
    try {
      // Check API availability
      if (!apiAvailable) {
        throw new Error('API indisponível');
      }
      
      const length = pageCount <= 5 ? "short" : pageCount <= 8 ? "medium" : "long";
      
      // Generate story content with OpenAI
      console.log("Generating story content with OpenAI");
      const result = await storyBot.generateStoryWithPrompts(
        characterName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt,
        length,
        readingLevel,
        language,
        ""
      );
      
      if (!result || !result.content || result.content.length === 0) {
        throw new Error('Falha ao gerar o conteúdo da história');
      }
      
      // Generate a cover image with Leonardo AI
      let coverImageUrl = '/placeholder.svg';
      try {
        const coverPrompt = `Book cover illustration in ${style} style for a children's book titled "${result.title}". The main character ${characterName} in a ${setting} setting with ${theme} theme. ${characterPrompt ? `Character details: ${characterPrompt}.` : ''} Create a captivating, colorful illustration suitable for a book cover.`;
        
        console.log("Generating cover image with Leonardo AI");
        coverImageUrl = await generateImage(coverPrompt, "1792x1024");
        console.log("Generated cover image with Leonardo AI:", coverImageUrl.substring(0, 50) + "...");
      } catch (error) {
        console.error("Failed to generate cover:", error);
        toast.error("Erro ao gerar a capa. Usando imagem padrão.");
      }
      
      // Generate illustrations for each page with Leonardo AI
      const pages = [];
      for (let i = 0; i < result.content.length; i++) {
        let imageUrl = '/placeholder.svg';
        try {
          const imagePrompt = result.imagePrompts[i] || 
            `Illustration in ${style} style for a children's book. Scene: ${result.content[i].substring(0, 200)}... Character ${characterName} in ${setting} with ${theme} theme. ${characterPrompt ? `Character details: ${characterPrompt}` : ''}`;
          
          console.log(`Generating image ${i+1} with Leonardo AI`);
          imageUrl = await generateImage(imagePrompt);
          console.log(`Generated image ${i+1} with Leonardo AI:`, imageUrl.substring(0, 50) + "...");
        } catch (error) {
          console.error(`Failed to generate image ${i+1}:`, error);
          toast.error(`Erro ao gerar a ilustração ${i+1}. Usando imagem padrão.`);
        }
        
        pages.push({
          text: result.content[i],
          imageUrl: imageUrl
        });
      }

      // Save all images to permanent storage to avoid expiration issues
      const storyData = {
        id: `story_${Date.now()}`,
        title: result.title,
        coverImageUrl: coverImageUrl,
        pages: pages.map(page => ({
          text: page.text,
          imageUrl: page.imageUrl
        }))
      };

      try {
        // Use directly imported function instead of dynamic import
        const processedStoryData = await saveStoryImagesPermanently(storyData);
        
        return {
          title: processedStoryData.title,
          coverImageUrl: processedStoryData.coverImageUrl || coverImageUrl,
          pages: processedStoryData.pages || pages
        };
      } catch (storageError) {
        console.error("Failed to save images to permanent storage:", storageError);
        // Continue with original story data if storage fails
        return {
          title: result.title,
          coverImageUrl: coverImageUrl,
          pages: pages
        };
      }
    } catch (error) {
      console.error("Error generating complete story:", error);
      throw error;
    }
  };
  
  return {
    apiAvailable,
    leonardoApiAvailable,
    useOpenAIForStories,
    openAIModel,
    isGenerating,
    useOpenAIForImages,
    useLeonardoAI,
    generateStoryBotResponse,
    checkOpenAIAvailability,
    setUseOpenAIForStories,
    generateCompleteStory,
    generateImage,
    generateImageWithOpenAI,
    setPromptById,
    loadPromptByName,
    listAvailablePrompts,
    getPromptReferenceImages,
    resetLeonardoApiStatus,
    setLeonardoApiKey
  };
};
