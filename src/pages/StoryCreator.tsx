
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Bot, 
  BookOpen, 
  ImageIcon, 
  Wand2, 
  Sparkles, 
  CheckCircle 
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useStoryBot } from "@/hooks/useStoryBot";
import { generateStoryWithGPT4, generateStory } from "@/utils/storyGenerator";
import { Progress } from "@/components/ui/progress";

type StoryPage = {
  text: string;
  imageUrl: string;
};

const StoryCreator = () => {
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("preparando");
  const { generateImageDescription, generateImage, generateCoverImage, apiAvailable } = useStoryBot();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  useEffect(() => {
    // Get story data from session storage
    const storedData = sessionStorage.getItem("create_story_data");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setStoryData(parsedData);
      
      // Start story generation process
      generateStoryContent(parsedData);
    } else {
      navigate("/create-story");
      toast.error("Dados da história não encontrados. Por favor, comece novamente.");
    }

    // Cleanup function to ensure we don't leave the page hanging
    return () => {
      // If we navigate away, make sure we clean up any pending processes
      setIsGenerating(false);
    };
  }, [navigate]);
  
  const updateProgress = (stage: string, percent: number) => {
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  const generateStoryContent = async (data: any) => {
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
        
        // Use fallback cover image based on theme
        coverImageUrl = `/images/covers/${data.theme}.jpg`;
        toast.error("Não foi possível gerar a capa personalizada. Usando imagem padrão.");
      }
      
      // Generate images for each page
      updateProgress("gerando-ilustracoes", 60);
      const pagesWithImages: StoryPage[] = [];
      
      for (let i = 0; i < storyResult.content.length; i++) {
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
          
          // Use fallback image based on theme
          imageUrl = `/images/placeholders/${data.theme}.jpg`;
        }
        
        pagesWithImages.push({
          text: pageText,
          imageUrl: imageUrl
        });
      }
      
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
        navigate("/view-story");
        toast.success("História gerada com sucesso!");
      }, 1000);
      
    } catch (error) {
      console.error("Error generating story:", error);
      setHasError(true);
      setErrorMessage("Ocorreu um erro ao gerar a história. Use o botão abaixo para tentar novamente.");
      toast.error("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
      setIsGenerating(false);
    }
  };
  
  const getStageIcon = () => {
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
  
  const handleRetry = () => {
    if (storyData) {
      setHasError(false);
      setProgress(0);
      setCurrentStage("preparando");
      generateStoryContent(storyData);
    } else {
      navigate("/create-story");
    }
  };
  
  const handleCancelAndReturn = () => {
    navigate("/create-story");
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
                <div className="absolute inset-0 rounded-full bg-indigo-100 animate-pulse"></div>
                {getStageIcon()}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">{getStageName()}</h2>
              <p className="text-slate-500 mb-4">{progress}% concluído</p>
              
              <div className="w-full max-w-md mb-6">
                <Progress value={progress} className="h-2.5" />
              </div>
              
              <div className="text-center max-w-md">
                <p className="text-sm text-slate-500">
                  {!apiAvailable ? 
                    "Usando gerador de histórias local para criar sua história rapidamente." :
                    "Este processo pode levar alguns minutos enquanto criamos ilustrações personalizadas."
                  }
                </p>
              </div>
            </div>
            
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
            
            {hasError ? (
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100 mb-6">
                <p className="text-red-600 mb-4">{errorMessage}</p>
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={handleRetry}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    onClick={handleCancelAndReturn}
                    className="px-4 py-2 border border-violet-200 text-violet-600 rounded-md hover:bg-violet-50 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <div className="flex items-center px-3 py-1.5 bg-indigo-50 rounded-full text-sm text-indigo-600">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    <span>{storyData?.childName || storyData?.characterName || 'Personagem'} está prestes a viver uma grande aventura!</span>
                  </div>
                </div>
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
