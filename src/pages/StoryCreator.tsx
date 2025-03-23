
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Bot, 
  BookOpen, 
  ImageIcon, 
  Wand2, 
  Sparkles, 
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useStoryBot } from "@/hooks/useStoryBot";
import { generateStoryWithGPT4, generateStory } from "@/utils/storyGenerator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type StoryPage = {
  text: string;
  imageUrl: string;
};

const MAX_RETRY_ATTEMPTS = 3;

const StoryCreator = () => {
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("preparando");
  const { generateImageDescription, generateImage, generateCoverImage, apiAvailable } = useStoryBot();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  
  // Function to clear generation state
  const resetGenerationState = useCallback(() => {
    setProgress(0);
    setCurrentStage("preparando");
    setHasError(false);
    setErrorMessage("");
    setRetryCount(0);
    setCancelRequested(false);
  }, []);
  
  useEffect(() => {
    // Get story data from session storage
    const storedData = sessionStorage.getItem("create_story_data");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setStoryData(parsedData);
        
        // Start story generation process
        resetGenerationState();
        generateStoryContent(parsedData);
      } catch (error) {
        console.error("Error parsing stored data:", error);
        navigate("/create-story");
        toast.error("Dados da história inválidos. Por favor, comece novamente.");
      }
    } else {
      navigate("/create-story");
      toast.error("Dados da história não encontrados. Por favor, comece novamente.");
    }

    // Cleanup function to ensure we don't leave the page hanging
    return () => {
      // If we navigate away, make sure we clean up any pending processes
      setIsGenerating(false);
      setCancelRequested(true);
    };
  }, [navigate, resetGenerationState]);
  
  const updateProgress = (stage: string, percent: number) => {
    if (cancelRequested) return;
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  const generateStoryContent = async (data: any) => {
    if (cancelRequested) return;
    
    setIsGenerating(true);
    setHasError(false);
    
    try {
      updateProgress("preparando", 10);
      
      const childImageBase64 = data.imagePreview || null;
      
      // Start story generation
      updateProgress("gerando-historia", 20);
      
      let storyResult;
      try {
        // Try to generate with GPT-4 first
        const openaiApiKey = "sk-dummy-key"; // This will be replaced by your actual API key in production
        storyResult = await generateStoryWithGPT4({
          childName: data.childName,
          childAge: data.childAge,
          theme: data.theme,
          setting: data.setting,
          imageUrl: data.imagePreview,
          characterPrompt: data.characterId ? `Personagem: ${data.characterName}` : undefined
        }, openaiApiKey);
        
        updateProgress("historia-gerada", 40);
      } catch (error) {
        console.log("Failed to generate with GPT-4, falling back to local generator:", error);
        
        if (cancelRequested) return;
        
        // If GPT-4 fails, use local generator
        storyResult = await generateStory({
          childName: data.childName,
          childAge: data.childAge,
          theme: data.theme,
          setting: data.setting,
          imageUrl: data.imagePreview,
          characterPrompt: data.characterId ? `Personagem: ${data.characterName}` : undefined
        });
        
        toast.info("Usando gerador de histórias local devido a limitações da API.");
        updateProgress("historia-gerada-local", 40);
      }
      
      if (cancelRequested) return;
      
      // Generate cover image
      updateProgress("gerando-capa", 50);
      let coverImageUrl;
      try {
        coverImageUrl = await generateCoverImage(
          storyResult.title,
          data.childName,
          data.theme,
          data.setting,
          childImageBase64
        );
      } catch (error) {
        console.error("Failed to generate cover image:", error);
        
        if (cancelRequested) return;
        
        // Use fallback cover image based on theme
        coverImageUrl = `/images/covers/${data.theme}.jpg`;
        toast.warning("Não foi possível gerar a capa personalizada. Usando imagem padrão.");
      }
      
      if (cancelRequested) return;
      
      // Generate images for each page
      updateProgress("gerando-ilustracoes", 60);
      const pagesWithImages: StoryPage[] = [];
      
      for (let i = 0; i < storyResult.content.length; i++) {
        if (cancelRequested) return;
        
        const pageText = storyResult.content[i];
        const progressPercent = 60 + Math.floor((i / storyResult.content.length) * 30);
        updateProgress(`ilustracao-${i+1}`, progressPercent);
        
        let imageDescription = "";
        let imageUrl = "";
        
        try {
          // Generate image description
          imageDescription = await generateImageDescription(
            pageText + (data.characterName ? ` com o personagem ${data.characterName}` : ''),
            data.childName,
            data.childAge,
            data.theme,
            data.setting
          );
          
          if (cancelRequested) return;
          
          // Generate image based on description
          imageUrl = await generateImage(
            imageDescription,
            data.childName,
            data.theme,
            data.setting,
            childImageBase64
          );
        } catch (error) {
          console.error("Failed to generate page image:", error);
          
          if (cancelRequested) return;
          
          // Use fallback image based on theme
          imageUrl = `/images/placeholders/${data.theme}.jpg`;
          toast.warning(`Falha ao gerar ilustração para página ${i+1}. Usando imagem padrão.`);
        }
        
        pagesWithImages.push({
          text: pageText,
          imageUrl: imageUrl
        });
      }
      
      if (cancelRequested) return;
      
      // Store complete story data in session storage
      updateProgress("finalizando", 95);
      
      sessionStorage.setItem("storyData", JSON.stringify({
        title: storyResult.title,
        coverImageUrl: coverImageUrl,
        childImage: data.imagePreview,
        childName: data.childName,
        childAge: data.childAge,
        theme: data.theme,
        setting: data.setting,
        characterId: data.characterId,
        characterName: data.characterName,
        pages: pagesWithImages
      }));
      
      updateProgress("concluido", 100);
      
      // Wait a bit for the progress bar to complete
      setTimeout(() => {
        if (!cancelRequested) {
          navigate("/view-story");
          toast.success("História gerada com sucesso!");
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error generating story:", error);
      
      if (cancelRequested) return;
      
      setHasError(true);
      setErrorMessage("Ocorreu um erro ao gerar a história. Use o botão abaixo para tentar novamente.");
      toast.error("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
      setIsGenerating(false);
    }
  };
  
  const handleRetry = () => {
    if (storyData) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setProgress(0);
      setCurrentStage("preparando");
      setCancelRequested(false);
      
      // Add slight delay before retrying to ensure cleanup
      setTimeout(() => {
        generateStoryContent(storyData);
      }, 500);
    } else {
      navigate("/create-story");
    }
  };
  
  const handleCancelAndReturn = () => {
    setCancelRequested(true);
    setIsGenerating(false);
    navigate("/create-story");
  };
  
  const getStageIcon = () => {
    if (hasError) {
      return <AlertTriangle className="h-12 w-12 text-amber-500" />;
    }
    
    switch (currentStage) {
      case "preparando": return <Bot className="h-12 w-12 text-indigo-500" />;
      case "gerando-historia": 
      case "historia-gerada":
      case "historia-gerada-local": return <BookOpen className="h-12 w-12 text-indigo-500" />;
      case "gerando-capa": return <ImageIcon className="h-12 w-12 text-indigo-500" />;
      case "gerando-ilustracoes": return <Wand2 className="h-12 w-12 text-indigo-500" />;
      case "concluido": return <CheckCircle className="h-12 w-12 text-emerald-500" />;
      default: return <Sparkles className="h-12 w-12 text-indigo-500" />;
    }
  };
  
  const getStageName = () => {
    if (hasError) {
      return "Encontramos um problema";
    }
    
    switch (currentStage) {
      case "preparando": return "Preparando sua história...";
      case "gerando-historia": return "Criando a narrativa...";
      case "historia-gerada": return "História criada com sucesso!";
      case "historia-gerada-local": return "História criada com o gerador local!";
      case "gerando-capa": return "Desenhando a capa...";
      case "gerando-ilustracoes": return "Ilustrando as páginas...";
      case "finalizando": return "Finalizando sua história...";
      case "concluido": return "História completa!";
      default: 
        if (currentStage.startsWith("ilustracao-")) {
          const pageNum = currentStage.split("-")[1];
          return `Ilustrando página ${pageNum}...`;
        }
        return "Criando magia...";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="container max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                Gerando sua História Mágica
              </h1>
              <p className="text-slate-600">
                Nossos artistas e contadores de histórias estão trabalhando para criar algo especial
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 rounded-full ${hasError ? 'bg-amber-100' : 'bg-indigo-100'} ${!hasError && isGenerating ? 'animate-pulse' : ''}`}></div>
                {getStageIcon()}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{getStageName()}</h2>
              
              {!hasError && (
                <>
                  <p className="text-slate-500 mb-4">{progress}% concluído</p>
                  
                  <div className="w-full max-w-md mb-6">
                    <Progress value={progress} className="h-2.5" />
                  </div>
                </>
              )}
              
              {hasError ? (
                <Alert variant="destructive" className="mt-4 max-w-md">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro de geração</AlertTitle>
                  <AlertDescription>
                    {errorMessage || "Encontramos um problema ao gerar sua história. Por favor, tente novamente."}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="text-center max-w-md">
                  <p className="text-sm text-slate-500">
                    {!apiAvailable ? 
                      "Usando gerador de histórias local para criar sua história rapidamente." :
                      "Este processo pode levar alguns minutos enquanto criamos ilustrações personalizadas."
                    }
                  </p>
                </div>
              )}
            </div>
            
            {!hasError && (
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {storyData && Array.from({ length: 5 }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`w-12 h-12 rounded-md flex items-center justify-center ${
                      progress > (index + 1) * 20 ? 'bg-violet-100 text-violet-500' : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    {progress > (index + 1) * 20 ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-current"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {hasError ? (
              <div className="text-center p-4 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row justify-center gap-4 mt-4">
                  <Button 
                    onClick={handleRetry}
                    variant="default"
                    className="gap-2"
                    disabled={retryCount >= MAX_RETRY_ATTEMPTS}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {retryCount >= MAX_RETRY_ATTEMPTS 
                      ? "Número máximo de tentativas excedido" 
                      : "Tentar Novamente"}
                  </Button>
                  <Button 
                    onClick={handleCancelAndReturn}
                    variant="outline"
                  >
                    Voltar
                  </Button>
                </div>
                {retryCount >= MAX_RETRY_ATTEMPTS && (
                  <p className="text-amber-600 text-sm mt-4">
                    O número máximo de tentativas foi excedido. Por favor, volte e tente criar uma nova história.
                  </p>
                )}
              </div>
            ) : progress < 100 && (
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <div className="flex items-center px-3 py-1.5 bg-indigo-50 rounded-full text-sm text-indigo-600">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    <span>{storyData?.childName || storyData?.characterName || 'Personagem'} está prestes a viver uma grande aventura!</span>
                  </div>
                </div>
                
                {progress > 10 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelAndReturn}
                    className="mt-6"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StoryCreator;
