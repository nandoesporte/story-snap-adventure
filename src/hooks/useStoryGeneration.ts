
import { useState } from "react";
import { toast } from "sonner";
import { useStoryBot } from "./useStoryBot";

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  
  const {
    generateCompleteStory: storyBotGenerateCompleteStory,
    leonardoApiAvailable
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
      
      // Verificar se a API de imagens está disponível
      if (!leonardoApiAvailable) {
        toast.warning("API de geração de imagens não está disponível. As ilustrações usarão imagens de placeholder.");
      }
      
      // Etapa 1: Preparar dados do personagem para consistência nas ilustrações
      setCurrentStage("Definindo personagem principal...");
      setProgress(10);
      
      // Etapa 2: Gerar história com personagens consistentes
      setCurrentStage("Criando a narrativa com personagens consistentes...");
      setProgress(15);
      
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
