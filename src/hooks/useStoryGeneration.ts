import { useState } from "react";
import { toast } from "sonner";
import { useStoryBot } from "./useStoryBot";
import { useStoryNarration } from "./useStoryNarration";
import { v4 as uuidv4 } from "uuid";

interface StoryResult {
  id: string;
  title: string;
  coverImageUrl: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterPrompt: string;
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
  
  const {
    generateCompleteStory: storyBotGenerateCompleteStory,
    leonardoApiAvailable,
    useOpenAIForStories,
    openAIModel,
    checkOpenAIAvailability,
    setUseOpenAIForStories,
    generateImageWithOpenAI
  } = useStoryBot();
  
  const { generateAudio, VOICE_IDS } = useStoryNarration({
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
    style: string = "papercraft"
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
      
      const openAiApiKey = localStorage.getItem('openai_api_key');
      if (!openAiApiKey) {
        toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
        return null;
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
        readingLevel,
        language,
        hasChildImage: !!childImageBase64,
        style: "papercraft"
      });
      
      const generateWithPersistence = async () => {
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
          "papercraft"
        );
        
        if (!result) {
          toast.error("Erro ao gerar a história. Tente novamente.");
          return null;
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
          pages: result.pages
        };
        
        setCurrentStage("Verificando a capa do livro...");
        
        if (!storyResult.coverImageUrl || 
            storyResult.coverImageUrl.includes('placeholder') || 
            storyResult.coverImageUrl.startsWith('/placeholder') ||
            storyResult.coverImageUrl.startsWith('https://images.unsplash.com')) {
          
          const maxCoverAttempts = 2;
          if (coverImageAttempt < maxCoverAttempts) {
            setCoverImageAttempt(prev => prev + 1);
            toast.info("Gerando capa do livro com OpenAI...");
            
            try {
              if (storyResult.pages && storyResult.pages.length > 0 && storyResult.pages[0].imageUrl) {
                storyResult.coverImageUrl = storyResult.pages[0].imageUrl;
                console.log("Using first page image as cover:", storyResult.coverImageUrl);
                toast.success("Usando imagem da primeira página como capa!");
              } else {
                const coverPrompt = `Book cover illustration in papercraft style for a children's book titled "${storyResult.title}". 
                The main character ${characterName} in a ${setting} setting with ${theme} theme. 
                ${characterPrompt ? `Character details: ${characterPrompt}.` : ''} 
                Create a captivating, colorful illustration suitable for a book cover. 
                Use papercraft visual style (layered colorful paper with depth).`;
                
                const coverUrl = await generateImageWithOpenAI(coverPrompt, "1792x1024");
                console.log("Generated new cover with OpenAI:", coverUrl);
                
                if (coverUrl) {
                  storyResult.coverImageUrl = coverUrl;
                  toast.success("Capa gerada com sucesso!");
                }
              }
            } catch (error) {
              console.error("Failed to generate cover with OpenAI:", error);
              toast.warning("Não foi possível gerar a capa do livro. Usando uma imagem padrão.");
            }
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
            if (imageGenerationAttempts >= maxAttempts) {
              toast.warning(`Não foi possível gerar a ilustração ${i + 1} após ${maxAttempts} tentativas. Usando imagem de placeholder.`);
              continue;
            }
            
            setImageGenerationAttempts(prev => prev + 1);
            toast.info(`Tentando novamente a geração da ilustração ${i + 1}...`);
            
            try {
              const pageText = storyResult.pages[i].text;
              const enhancedPrompt = `Papercraft style illustration for a children's book showing ${characterName} in ${setting} with ${theme} theme. 
              Scene: ${pageText.substring(0, 200)}... 
              ${characterPrompt ? `Character details: ${characterPrompt}` : ''}
              Style: Layered colorful paper with depth effect (papercraft).`;
              
              const newImageUrl = await generateImageWithOpenAI(enhancedPrompt);
              if (newImageUrl) {
                storyResult.pages[i].imageUrl = newImageUrl;
                console.log(`Regenerated image ${i+1} successfully with OpenAI`);
                continue;
              }
            } catch (error) {
              console.error(`Failed to regenerate image ${i+1} with OpenAI:`, error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            i = i - 1;
            continue;
          }
          
          const baseProgress = 50;
          const progressPerImage = (100 - baseProgress) / storyResult.pages.length;
          setProgress(baseProgress + progressPerImage * (i + 1));
        }
        
        if (storyResult && storyResult.pages) {
          const elevenlabsApiKey = localStorage.getItem('elevenlabs_api_key');
          if (!elevenlabsApiKey) {
            console.warn("ElevenLabs API key not configured, skipping narration generation");
            toast.warning("Chave da API ElevenLabs não configurada. As narrações não serão geradas.");
          } else {
            setGeneratingNarration(true);
            setCurrentStage("Gerando narrações para as páginas...");
            toast.info("Iniciando geração de narrações para as páginas...");
            
            const voiceId = language && language.toLowerCase() === 'english' ? 
                VOICE_IDS.male : 
                VOICE_IDS.female;
            
            for (let i = 0; i < storyResult.pages.length; i++) {
              setCurrentNarrationIndex(i + 1);
              setCurrentStage(`Gerando narração ${i + 1} de ${storyResult.pages.length}...`);
              
              try {
                await generateAudio(voiceId, {
                  storyId: storyResult.id,
                  text: storyResult.pages[i].text,
                  pageIndex: i
                });
                
                const narrationProgress = 80 + (20 * (i + 1) / storyResult.pages.length);
                setProgress(Math.min(narrationProgress, 99));
              } catch (error) {
                console.error(`Error generating narration for page ${i+1}:`, error);
              }
              
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            toast.success("Narrações geradas com sucesso!");
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
      toast.error("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
      throw error;
    } finally {
      setIsGenerating(false);
      setGeneratingNarration(false);
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
    currentNarrationIndex
  };
};
