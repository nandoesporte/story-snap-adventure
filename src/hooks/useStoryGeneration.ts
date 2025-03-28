
import { useState } from "react";
import { toast } from "sonner";
import { useStoryBot } from "./useStoryBot";

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [imageGenerationAttempts, setImageGenerationAttempts] = useState(0);
  const [coverImageAttempt, setCoverImageAttempt] = useState(0);
  
  const {
    generateCompleteStory: storyBotGenerateCompleteStory,
    leonardoApiAvailable,
    useOpenAIForStories,
    openAIModel,
    checkOpenAIAvailability,
    setUseOpenAIForStories,
    generateImageWithOpenAI
  } = useStoryBot();
  
  /**
   * Gera uma história completa com título, texto e ilustrações
   * com personagens consistentes ao longo da narrativa
   */
  const generateCompleteStory = async (
    characterName: string, // This is now the selected character name, not child name
    childAge: string,
    theme: string,
    setting: string,
    moralTheme: string = "",
    characterPrompt: string = "",
    length: string = "medium",
    readingLevel: string = "intermediate",
    language: string = "portuguese",
    childImageBase64: string | null = null,
    style: string = "papercraft" // Changed default style to papercraft
  ) => {
    try {
      setIsGenerating(true);
      setProgress(5);
      setCurrentStage("Iniciando a criação da história...");
      setCurrentImageIndex(0);
      setTotalImages(0);
      setImageGenerationAttempts(0);
      setCoverImageAttempt(0);
      
      // Always forcefully set to use OpenAI for image generation
      const openAiApiKey = localStorage.getItem('openai_api_key');
      if (!openAiApiKey) {
        toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
        return null;
      }
      
      // Force use of OpenAI regardless of other settings
      setUseOpenAIForStories(true, 'gpt-4o-mini');
      toast.info("Usando OpenAI para gerar a história e ilustrações em estilo papercraft.");
      
      // Etapa 1: Preparar dados do personagem para consistência nas ilustrações
      setCurrentStage(`Definindo personagem principal "${characterName}"...`);
      setProgress(10);
      
      // Verificar se há um prompt de personagem detalhado
      if (!characterPrompt || characterPrompt.trim().length < 10) {
        console.log("Character prompt is minimal, generating a basic description...");
        characterPrompt = `Personagem ${characterName}: um personagem de ${childAge} anos, alegre e curioso.`;
      } else {
        console.log(`Using provided character prompt for ${characterName}: ${characterPrompt.substring(0, 50)}...`);
      }
      
      // Etapa 2: Gerar história com personagens consistentes
      setCurrentStage(`Criando a narrativa com o personagem ${characterName}...`);
      setProgress(15);
      
      console.log("Generating complete story with params:", {
        characterName,
        childAge,
        theme,
        setting,
        moralTheme,
        characterPrompt: characterPrompt?.substring(0, 50) + "...",
        length, 
        readingLevel,
        language,
        hasChildImage: !!childImageBase64,
        style: "papercraft" // Force papercraft style for consistent logging
      });
      
      // Implementação de geração persistente
      const generateWithPersistence = async () => {
        // Always use papercraft style regardless of what was passed in
        let result = await storyBotGenerateCompleteStory(
          characterName,
          childAge,
          theme,
          setting,
          moralTheme,
          characterPrompt,
          length,
          readingLevel,
          language,
          childImageBase64,
          "papercraft" // Force papercraft style
        );
        
        if (!result) {
          toast.error("Erro ao gerar a história. Tente novamente.");
          return null;
        }
        
        // Primeiro verificar se a capa foi gerada corretamente
        setCurrentStage("Verificando a capa do livro...");
        
        // Verificar se a capa foi gerada com OpenAI
        if (!result.coverImageUrl || 
            result.coverImageUrl.includes('placeholder') || 
            result.coverImageUrl.startsWith('/placeholder') ||
            result.coverImageUrl.startsWith('https://images.unsplash.com')) {
          
          // Tentar gerar a capa com OpenAI diretamente
          const maxCoverAttempts = 2;
          if (coverImageAttempt < maxCoverAttempts) {
            setCoverImageAttempt(prev => prev + 1);
            toast.info("Gerando capa do livro com OpenAI...");
            
            try {
              const coverPrompt = `Book cover illustration in papercraft style for a children's book titled "${result.title}". 
              The main character ${characterName} in a ${setting} setting with ${theme} theme. 
              ${characterPrompt ? `Character details: ${characterPrompt}.` : ''} 
              Create a captivating, colorful illustration suitable for a book cover. 
              Use papercraft visual style (layered colorful paper with depth).`;
              
              const coverUrl = await generateImageWithOpenAI(coverPrompt, "1792x1024");
              console.log("Generated new cover with OpenAI:", coverUrl);
              
              if (coverUrl) {
                result.coverImageUrl = coverUrl;
                toast.success("Capa gerada com sucesso!");
              }
            } catch (error) {
              console.error("Failed to generate cover with OpenAI:", error);
              toast.warning("Não foi possível gerar a capa do livro. Usando uma imagem padrão.");
            }
          }
        }
        
        // Controle de geração de imagens
        if (result && result.pages) {
          setTotalImages(result.pages.length);
          
          // Validar cada imagem gerada
          for (let i = 0; i < result.pages.length; i++) {
            setCurrentImageIndex(i + 1);
            setCurrentStage(`Verificando ilustração ${i + 1} de ${result.pages.length}...`);
            
            const imgUrl = result.pages[i].imageUrl;
            
            // Verificar se a imagem foi gerada corretamente
            if (!imgUrl || 
                imgUrl.includes('placeholder') || 
                imgUrl.startsWith('/placeholder') ||
                imgUrl.startsWith('https://images.unsplash.com')) {
              
              // Se for a última tentativa, continue mesmo com placeholder
              const maxAttempts = 3;
              if (imageGenerationAttempts >= maxAttempts) {
                toast.warning(`Não foi possível gerar a ilustração ${i + 1} após ${maxAttempts} tentativas. Usando imagem de placeholder.`);
                continue;
              }
              
              // Tentar novamente apenas a geração de imagens
              setImageGenerationAttempts(prev => prev + 1);
              toast.info(`Tentando novamente a geração da ilustração ${i + 1}...`);
              
              // Tentar gerar diretamente com OpenAI
              try {
                const pageText = result.pages[i].text;
                const enhancedPrompt = `Papercraft style illustration for a children's book showing ${characterName} in ${setting} with ${theme} theme. 
                Scene: ${pageText.substring(0, 200)}... 
                ${characterPrompt ? `Character details: ${characterPrompt}` : ''}
                Style: Layered colorful paper with depth effect (papercraft).`;
                
                const newImageUrl = await generateImageWithOpenAI(enhancedPrompt);
                if (newImageUrl) {
                  result.pages[i].imageUrl = newImageUrl;
                  console.log(`Regenerated image ${i+1} successfully with OpenAI`);
                  continue;
                }
              } catch (error) {
                console.error(`Failed to regenerate image ${i+1} with OpenAI:`, error);
              }
              
              // Aguardar 2 segundos antes de tentar novamente
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Retornar para o início do loop para tentar novamente
              i = i - 1;
              continue;
            }
            
            // Atualizar o progresso baseado na validação das imagens
            const baseProgress = 50; // Até a geração da história
            const progressPerImage = (100 - baseProgress) / result.pages.length;
            setProgress(baseProgress + progressPerImage * (i + 1));
          }
        }
        
        return result;
      };
      
      const result = await generateWithPersistence();
      
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
    currentStage,
    currentImageIndex,
    totalImages
  };
};
