
import { useState, useEffect } from 'react';
import { StoryBot } from '@/services/StoryBot';
import { generateImageWithOpenAI } from '@/lib/openai';
import { toast } from 'sonner';

// Create a singleton instance of the StoryBot
const storyBot = new StoryBot();

export const useStoryBot = () => {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [leonardoApiAvailable, setLeonardoApiAvailable] = useState<boolean>(false);
  const [useOpenAIForStories, setUseOpenAIFlag] = useState<boolean>(true);
  const [openAIModel, setOpenAIModel] = useState<string>('gpt-4o-mini');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  useEffect(() => {
    const isApiAvailable = storyBot.isApiAvailable();
    setApiAvailable(isApiAvailable);
    
    const isLeonardoApiAvailable = localStorage.getItem('leonardo_webhook_url') !== null;
    setLeonardoApiAvailable(isLeonardoApiAvailable);
    
    // Load saved model
    const savedModel = localStorage.getItem('openai_model');
    if (savedModel) {
      setOpenAIModel(savedModel);
    }
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
  
  // Add the missing methods needed by components
  const resetLeonardoApiStatus = () => {
    localStorage.removeItem('leonardo_webhook_url');
    localStorage.removeItem('leonardo_api_key');
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
      
      // Generate a cover image
      let coverImageUrl = '/placeholder.svg';
      try {
        const coverPrompt = `Book cover illustration in ${style} style for a children's book titled "${result.title}". The main character ${characterName} in a ${setting} setting with ${theme} theme. ${characterPrompt ? `Character details: ${characterPrompt}.` : ''} Create a captivating, colorful illustration suitable for a book cover.`;
        coverImageUrl = await generateImageWithOpenAI(coverPrompt, "1792x1024");
        console.log("Generated cover with OpenAI:", coverImageUrl);
      } catch (error) {
        console.error("Failed to generate cover with OpenAI:", error);
        toast.error("Erro ao gerar a capa. Usando imagem padrão.");
      }
      
      // Generate illustrations for each page
      const pages = [];
      for (let i = 0; i < result.content.length; i++) {
        let imageUrl = '/placeholder.svg';
        try {
          const imagePrompt = result.imagePrompts[i] || 
            `Illustration in ${style} style for a children's book. Scene: ${result.content[i].substring(0, 200)}... Character ${characterName} in ${setting} with ${theme} theme. ${characterPrompt ? `Character details: ${characterPrompt}` : ''}`;
          
          imageUrl = await generateImageWithOpenAI(imagePrompt);
          console.log(`Generated image ${i+1} with OpenAI:`, imageUrl.substring(0, 50) + "...");
        } catch (error) {
          console.error(`Failed to generate image ${i+1} with OpenAI:`, error);
          toast.error(`Erro ao gerar a ilustração ${i+1}. Usando imagem padrão.`);
        }
        
        pages.push({
          text: result.content[i],
          imageUrl: imageUrl
        });
      }
      
      return {
        title: result.title,
        coverImageUrl,
        pages
      };
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
    generateStoryBotResponse,
    checkOpenAIAvailability,
    setUseOpenAIForStories,
    generateCompleteStory,
    generateImageWithOpenAI,
    setPromptById,
    loadPromptByName,
    listAvailablePrompts,
    getPromptReferenceImages,
    resetLeonardoApiStatus,
    setLeonardoApiKey
  };
};
