
import { useState } from "react";
import { toast } from "sonner";
import { useStoryBot } from "./useStoryBot";
import { useStoryNarration } from "./useStoryNarration";
import { v4 as uuidv4 } from "uuid";
import { saveImagePermanently } from "@/lib/imageStorage";
import { VoiceType } from "@/lib/tts";

interface StoryResult {
  id: string;
  title: string;
  coverImageUrl: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterPrompt: string;
  voiceType: VoiceType;
  pages: Array<{
    text: string;
    imageUrl: string;
  }>;
}

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [imageGenerationAttempts, setImageGenerationAttempts] = useState(0);
  const [coverImageAttempt, setCoverImageAttempt] = useState(0);
  const [generatingNarration, setGeneratingNarration] = useState(false);
  const [currentNarrationIndex, setCurrentNarrationIndex] = useState(0);
  const [connectionErrorCount, setConnectionErrorCount] = useState(0);
  const [useImgBB, setUseImgBB] = useState(true);

  const {
    generateCompleteStory: storyBotGenerateCompleteStory,
    leonardoApiAvailable,
    useOpenAIForStories,
    openAIModel,
    checkOpenAIAvailability,
    setUseOpenAIForStories,
    generateImageWithOpenAI,
    setPromptById,
    loadPromptByName
  } = useStoryBot();

  const { generateAudio, VOICE_IDS, VOICE_PRESETS } = useStoryNarration({
    storyId: '',
    text: '',
    pageIndex: 0
  });

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
    style: string = "papercraft",
    voiceType: VoiceType = 'female'
  ) => {
    try {
      setIsGenerating(true);
      setProgress(5);
      setCurrentStage("Iniciando a criação da história...");
      setCurrentImageIndex(0);
      setTotalImages(0);
      setImageGenerationAttempts(0);
      setCoverImageAttempt(0);
      setGeneratingNarration(false);
      setCurrentNarrationIndex(0);
      setConnectionErrorCount(0);

      const openAiApiKey = localStorage.getItem('openai_api_key');
      if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
        toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
        setIsGenerating(false);
        throw new Error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
      }

      try {
        setCurrentStage("Verificando a chave da API OpenAI...");
        const isValid = await checkOpenAIAvailability();
        if (!isValid) {
          toast.error("A chave da API OpenAI fornecida parece ser inválida. Por favor, verifique suas configurações.");
          setIsGenerating(false);
          throw new Error("A chave da API OpenAI fornecida parece ser inválida. Por favor, verifique suas configurações.");
        }
      } catch (error) {
        console.error("Erro ao verificar chave da API OpenAI:", error);
        toast.error("Não foi possível validar a chave da API OpenAI. Verifique sua conexão e configurações.");
        setIsGenerating(false);
        throw new Error("Não foi possível validar a chave da API OpenAI. Verifique sua conexão e configurações.");
      }

      setUseOpenAIForStories(true, 'gpt-4o-mini');
      toast.info("Usando OpenAI para gerar a história e ilustrações em estilo papercraft.");

      setCurrentStage(`Definindo personagem principal "${characterName}"...`);
      setProgress(10);

      if (!characterPrompt || characterPrompt.trim().length < 10) {
        console.log("Character prompt is minimal, generating a basic description...");
        characterPrompt = `Personagem ${characterName}: um personagem de ${childAge} anos, alegre e curioso.`;
      } else {
        console.log(`Using provided character prompt for ${characterName}: ${characterPrompt.substring(0, 50)}...`);
      }

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
        exactPageCount: getPageCountFromLength(length),
        readingLevel,
        language,
        hasChildImage: !!childImageBase64,
        style: "papercraft",
        voiceType
      });

      const generateWithPersistence = async () => {
        let result;
        try {
          const exactPageCount = getPageCountFromLength(length);
          result = await storyBotGenerateCompleteStory(
            characterName,
            childAge,
            theme,
            setting,
            moralTheme,
            characterPrompt,
            exactPageCount,
            readingLevel,
            language,
            childImageBase64,
            "papercraft"
          );
        } catch (error) {
          console.error("Erro na geração de história:", error);
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (errorMessage.includes("API key") || errorMessage.includes("401")) {
            toast.error("Erro na chave da API OpenAI. Por favor, verifique suas configurações.");
            throw new Error("Erro na chave da API. Verifique suas configurações.");
          } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
            toast.error("Limite de requisições excedido na API OpenAI. Tente novamente mais tarde.");
            throw new Error("Limite de requisições excedido. Tente novamente mais tarde.");
          } else if (errorMessage.includes("Connection error") || errorMessage.includes("network")) {
            toast.error("Erro de conexão ao se comunicar com a API. Verifique sua conexão de internet.");
            throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
          } else {
            toast.error("Erro ao gerar a história. Tente novamente.");
            throw new Error("Falha na geração da história");
          }
        }

        if (!result) {
          toast.error("Erro ao gerar a história. Tente novamente.");
          throw new Error("Resultado da geração de história é nulo");
        }

        const storyId = uuidv4();

        const storyResult: StoryResult = {
          id: storyId,
          title: result.title,
          coverImageUrl: result.coverImageUrl,
          childName: characterName,
          childAge,
          theme,
          setting,
          characterPrompt,
          voiceType: voiceType,
          pages: result.pages
        };

        setCurrentStage("Verificando a capa do livro...");

        if (!storyResult.coverImageUrl || 
            storyResult.coverImageUrl.includes('placeholder') || 
            storyResult.coverImageUrl.startsWith('/placeholder') ||
            storyResult.coverImageUrl.startsWith('https://images.unsplash.com')) {
          
          const maxCoverAttempts = 3;
          let coverGenerated = false;
          
          for (let attempt = 0; attempt < maxCoverAttempts && !coverGenerated; attempt++) {
            setCoverImageAttempt(attempt + 1);
            toast.info(`Gerando capa do livro com ImgBB (tentativa ${attempt + 1} de ${maxCoverAttempts})...`);
            
            try {
              if (storyResult.pages && storyResult.pages.length > 0 && 
                  storyResult.pages[0].imageUrl && 
                  !storyResult.pages[0].imageUrl.includes('placeholder')) {
                storyResult.coverImageUrl = storyResult.pages[0].imageUrl;
                console.log("Using first page image as cover:", storyResult.coverImageUrl);
                toast.success("Usando imagem da primeira página como capa!");
                coverGenerated = true;
              } else {
                const coverPrompt = `Book cover illustration in papercraft style for a children's book titled "${storyResult.title}". 
                The main character ${characterName} in a ${setting} setting with ${theme} theme. 
                ${characterPrompt ? `Character details: ${characterPrompt}.` : ''} 
                Create a captivating, colorful illustration suitable for a book cover. 
                Use papercraft visual style (layered colorful paper with depth).`;
                
                const waitTime = 3000 * (attempt + 1);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                const coverUrl = await generateImageWithOpenAI(coverPrompt, "1792x1024", theme);
                console.log(`Generated new cover with OpenAI (attempt ${attempt + 1}):`, coverUrl);
                
                if (coverUrl && !coverUrl.includes('placeholder') && !coverUrl.includes('default')) {
                  // Usar ImgBB para salvar imagem permanentemente
                  const permanentUrl = await saveImagePermanently(coverUrl, `cover_${storyResult.id}`);
                  
                  if (permanentUrl) {
                    storyResult.coverImageUrl = permanentUrl;
                    toast.success(`Capa gerada e salva no ImgBB!`);
                    coverGenerated = true;
                  }
                }
              }
            } catch (error) {
              console.error(`Failed to generate cover with OpenAI (attempt ${attempt + 1}):`, error);
              if (error instanceof Error) {
                if (error.message.includes("Connection error")) {
                  setConnectionErrorCount(prev => prev + 1);
                  toast.warning(`Problemas de conexão ao gerar capa. Tentando novamente...`);
                  await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                  toast.warning(`Tentativa ${attempt + 1} falhou: ${error.message}`);
                }
              }
            }
          }
          
          if (!coverGenerated) {
            const defaultCoverUrl = `/images/defaults/${theme || 'default'}_cover.jpg`;
            storyResult.coverImageUrl = defaultCoverUrl;
            toast.warning("Não foi possível gerar a capa. Usando imagem padrão.");
          }
        }

        setTotalImages(storyResult.pages.length);

        for (let i = 0; i < storyResult.pages.length; i++) {
          setCurrentImageIndex(i + 1);
          setCurrentStage(`Verificando ilustração ${i + 1} de ${storyResult.pages.length}...`);
          
          const imgUrl = storyResult.pages[i].imageUrl;
          
          if (!imgUrl || 
              imgUrl.includes('placeholder') || 
              imgUrl.startsWith('/placeholder') ||
              imgUrl.startsWith('https://images.unsplash.com')) {
            
            const maxAttempts = 3;
            let imageGenerated = false;
            
            for (let attempt = 0; attempt < maxAttempts && !imageGenerated; attempt++) {
              setImageGenerationAttempts(prev => prev + 1);
              toast.info(`Gerando ilustração ${i + 1} com ImgBB (tentativa ${attempt + 1} de ${maxAttempts})...`);
              
              try {
                if (attempt > 0) {
                  await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
                }
                
                const pageText = storyResult.pages[i].text;
                const enhancedPrompt = `Papercraft style illustration for a children's book showing ${characterName} in ${setting} with ${theme} theme. 
                Scene: ${pageText.substring(0, 200)}... 
                ${characterPrompt ? `Character details: ${characterPrompt}` : ''}
                Style: Layered colorful paper with depth effect (papercraft).`;
                
                const newImageUrl = await generateImageWithOpenAI(enhancedPrompt, "1024x1024", theme);
                if (newImageUrl && !newImageUrl.includes('placeholder') && !newImageUrl.includes('default')) {
                  // Usar ImgBB para salvar a imagem permanentemente
                  const permanentUrl = await saveImagePermanently(newImageUrl, `page_${i+1}_${storyResult.id}`);
                  
                  if (permanentUrl) {
                    storyResult.pages[i].imageUrl = permanentUrl;
                    console.log(`Generated image ${i+1} and saved to ImgBB`);
                    imageGenerated = true;
                  }
                } else {
                  console.warn(`Image generation for page ${i+1} returned default/placeholder image:`, newImageUrl);
                }
              } catch (error) {
                console.error(`Failed to generate image ${i+1} with OpenAI (attempt ${attempt+1}):`, error);
                if (error instanceof Error && error.message.includes("Connection error")) {
                  setConnectionErrorCount(prev => prev + 1);
                  toast.warning(`Problemas de conexão ao gerar ilustração ${i+1}. Tentando novamente...`);
                } else {
                  const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                  toast.warning(`Tentativa ${attempt+1} falhou: ${errorMsg}`);
                }
              }
            }
            
            if (!imageGenerated) {
              storyResult.pages[i].imageUrl = `/images/defaults/${theme || 'default'}.jpg`;
              toast.warning(`Não foi possível gerar a ilustração ${i+1}. Usando imagem padrão.`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (connectionErrorCount >= 3) {
              toast.error("Problemas persistentes de conexão detectados. Usando imagens padrão para as páginas restantes.");
              for (let j = i + 1; j < storyResult.pages.length; j++) {
                storyResult.pages[j].imageUrl = `/images/defaults/${theme || 'default'}.jpg`;
              }
              break;
            }
          }
          
          const baseProgress = 50;
          const progressPerImage = (100 - baseProgress) / storyResult.pages.length;
          setProgress(baseProgress + progressPerImage * (i + 1));
        }

        if (storyResult && storyResult.pages) {
          const googleTtsApiKey = localStorage.getItem('google_tts_api_key');
          if (!googleTtsApiKey) {
            console.warn("Google TTS API key not configured, skipping narration generation");
            toast.warning("Chave da API Google Text-to-Speech não configurada. As narrações não serão geradas.");
          } else {
            setGeneratingNarration(true);
            setCurrentStage("Gerando narrações humanizadas para as páginas...");
            toast.info("Iniciando geração de narrações humanizadas para as páginas...");
            
            const maxNarrationAttempts = 2;
            let narrationFailures = 0;
            
            for (let i = 0; i < storyResult.pages.length; i++) {
              try {
                setCurrentNarrationIndex(i + 1);
                setCurrentStage(`Gerando narração humanizada ${i + 1} de ${storyResult.pages.length}...`);
                
                console.log(`Gerando narração humanizada para página ${i+1} de ${storyResult.pages.length} com voz ${voiceType}`);
                
                let narrationSuccess = false;
                let attempts = 0;
                
                while (!narrationSuccess && attempts < maxNarrationAttempts) {
                  try {
                    attempts++;
                    console.log(`Tentativa ${attempts} de gerar narração humanizada para página ${i+1}`);
                    
                    const audioUrl = await generateAudio(voiceType, {
                      storyId: storyResult.id,
                      text: storyResult.pages[i].text,
                      pageIndex: i,
                      voiceType: voiceType
                    });
                    
                    if (audioUrl) {
                      narrationSuccess = true;
                      console.log(`Narração humanizada gerada com sucesso para página ${i+1}: ${audioUrl}`);
                    }
                    
                    const narrationProgress = 80 + (20 * (i + 1) / storyResult.pages.length);
                    setProgress(Math.min(narrationProgress, 99));
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } catch (error) {
                    console.error(`Erro na tentativa ${attempts} de gerar narração para página ${i+1}:`, error);
                    
                    if (attempts >= maxNarrationAttempts) {
                      narrationFailures++;
                      console.warn(`Falha após ${maxNarrationAttempts} tentativas para página ${i+1}`);
                      toast.error(`Falha ao gerar narração para página ${i+1}. Pulando para a próxima.`);
                      continue;
                    } else {
                      await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                  }
                }
              } catch (loopError) {
                console.error(`Erro no processamento da narração para página ${i+1}:`, loopError);
                narrationFailures++;
                toast.error(`Erro no processamento da narração para página ${i+1}.`);
                continue;
              }
              
              const narrationProgress = 80 + (20 * (i + 1) / storyResult.pages.length);
              setProgress(Math.min(narrationProgress, 99));
            }
            
            if (narrationFailures > 0) {
              if (narrationFailures === storyResult.pages.length) {
                toast.error(`Não foi possível gerar nenhuma narração. Verifique sua chave da API Google TTS.`);
              } else {
                toast.warning(`${narrationFailures} narrações não puderam ser geradas. As demais estão disponíveis.`);
              }
            } else {
              toast.success("Todas as narrações humanizadas foram geradas com sucesso e salvas no banco de dados!");
            }
          }
        }

        return storyResult;
      };

      const result = await generateWithPersistence();

      setProgress(100);
      setCurrentStage("História gerada com sucesso!");

      return result;
    } catch (error) {
      console.error("Erro ao gerar história completa:", error);
      setProgress(0);
      setCurrentStage("Falha na geração da história");
      throw error;
    } finally {
      setIsGenerating(false);
      setGeneratingNarration(false);
    }
  };

  const getPageCountFromLength = (length: string): number => {
    switch (length) {
      case "short": return 5;
      case "medium": return 8;
      case "long": return 12;
      default: return 5;
    }
  };

  return {
    generateCompleteStory,
    isGenerating,
    progress,
    currentStage,
    currentImageIndex,
    totalImages,
    generatingNarration,
    currentNarrationIndex,
    setPromptById,
    loadPromptByName,
    useImgBB,
    setUseImgBB
  };
};
