
import { useState } from 'react';
import { toast } from 'sonner';
import { StoryBot, StoryGenerationResult } from '@/services/StoryBot';
import { LeonardoAIAgent } from '@/services/LeonardoAIAgent';

export type StoryPage = {
  text: string;
  imageUrl: string;
};

export type CompleteBook = {
  title: string;
  coverImageUrl: string;
  pages: StoryPage[];
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterPrompt?: string;
};

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('preparando');
  
  const storyBot = new StoryBot();
  const leonardoAgent = new LeonardoAIAgent();
  
  const updateProgress = (stage: string, percent: number) => {
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  const generateCompleteStory = async (
    characterName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    length: string = "medium",
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    childImageBase64: string | null = null,
    style: string = "cartoon",
    storyContext: string = ""
  ): Promise<CompleteBook> => {
    try {
      setIsGenerating(true);
      
      // Step 1: Generate story content with illustration prompts
      updateProgress("gerando narrativa", 10);
      const storyData = await storyBot.generateStoryWithPrompts(
        characterName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt,
        length,
        readingLevel,
        language,
        storyContext
      );
      
      console.log("Generated story:", {
        title: storyData.title,
        pages: storyData.content.length,
        imagePrompts: storyData.imagePrompts.length
      });
      
      // Step 2: Generate cover image
      updateProgress("criando capa", 30);
      const coverImageUrl = await leonardoAgent.generateCoverImage(
        storyData.title,
        characterName,
        theme,
        setting,
        style,
        characterPrompt,
        childImageBase64
      );
      
      // Step 3: Generate illustrations for all pages
      updateProgress(`gerando ilustrações (0/${storyData.content.length})`, 40);
      const imageUrls = await leonardoAgent.generateStoryImages(
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
      
      // Step 4: Compile the complete book
      updateProgress("finalizando", 90);
      const completeBook: CompleteBook = {
        title: storyData.title,
        coverImageUrl,
        childName: characterName,
        childAge,
        theme,
        setting,
        characterPrompt,
        pages: storyData.content.map((text, index) => ({
          text,
          imageUrl: imageUrls[index] || "/placeholder.svg"
        }))
      };
      
      updateProgress("concluído", 100);
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

  return {
    generateCompleteStory,
    isGenerating,
    progress,
    currentStage,
    updateProgress
  };
};
