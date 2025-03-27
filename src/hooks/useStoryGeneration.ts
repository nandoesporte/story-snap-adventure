
import { useState } from "react";
import { toast } from "sonner";
import { useStoryBot } from "./useStoryBot";

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  
  const {
    generateCompleteStory: storyBotGenerateCompleteStory,
    leonardoApiAvailable,
    useOpenAIForStories,
    openAIModel,
    checkOpenAIAvailability
  } = useStoryBot();
  
  /**
   * Gera uma história completa com título, texto e ilustrações
   * com personagens consistentes ao longo da narrativa
   */
  const generateCompleteStory = async (
    childName: string,
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    length: string = "medium",
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    childImageBase64: string | null = null,
    style: string = "cartoon"
  ) => {
    try {
      setIsGenerating(true);
      setProgress(5);
      setCurrentStage("Iniciando a criação da história...");
      
      // Verificar disponibilidade das APIs de imagens
      const isLeonardoAvailable = leonardoApiAvailable;
      const isOpenAIAvailable = checkOpenAIAvailability();
      
      if (!isLeonardoAvailable && !isOpenAIAvailable) {
        toast.warning("APIs de geração de imagens não estão disponíveis. As ilustrações usarão imagens de placeholder.");
      } else if (useOpenAIForStories && isOpenAIAvailable) {
        toast.info(`Usando OpenAI ${openAIModel} para gerar a história e ilustrações.`);
      } else if (isLeonardoAvailable) {
        toast.info("Usando Gemini para gerar a história e Leonardo.ai para ilustrações.");
      } else {
        toast.warning("Usando imagens de placeholder para ilustrações.");
      }
      
      // Etapa 1: Preparar dados do personagem para consistência nas ilustrações
      setCurrentStage("Definindo personagem principal...");
      setProgress(10);
      
      // Verificar se há um prompt de personagem detalhado
      if (!characterPrompt || characterPrompt.trim().length < 10) {
        console.log("Character prompt is minimal, generating a basic description...");
        characterPrompt = `Personagem ${childName}: uma criança de ${childAge} anos, alegre e curiosa.`;
      }
      
      // Etapa 2: Gerar história com personagens consistentes
      setCurrentStage("Criando a narrativa com personagens consistentes...");
      setProgress(15);
      
      console.log("Generating complete story with params:", {
        childName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt: characterPrompt?.substring(0, 50) + "...",
        length, 
        readingLevel,
        language,
        hasChildImage: !!childImageBase64,
        style
      });
      
      const result = await storyBotGenerateCompleteStory(
        childName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt,
        length,
        readingLevel,
        language,
        childImageBase64,
        style
      );
      
      setProgress(100);
      setCurrentStage("História gerada com sucesso!");
      
      return result;
    } catch (error) {
      console.error("Erro ao gerar história completa:", error);
      toast.error("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  return {
    generateCompleteStory,
    isGenerating,
    progress,
    currentStage
  };
};
