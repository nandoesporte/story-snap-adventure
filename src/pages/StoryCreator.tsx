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
  AlertTriangle,
  Edit,
  Save
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookGenerationService, 
  CompleteStory, 
  StoryInputData, 
  GeneratedStory 
} from "@/services/BookGenerationService";

const MAX_RETRY_ATTEMPTS = 3;

const StoryCreator = () => {
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<StoryInputData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("preparando");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editPageText, setEditPageText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [bookGenerator, setBookGenerator] = useState<BookGenerationService | null>(null);
  
  const resetGenerationState = useCallback(() => {
    setProgress(0);
    setCurrentStage("preparando");
    setHasError(false);
    setErrorMessage("");
    setRetryCount(0);
    setCancelRequested(false);
    setShowReview(false);
    setGeneratedStory(null);
    setIsEditing(false);
    setEditingPage(null);
    setEditPageText("");
    setEditTitle("");
  }, []);
  
  useEffect(() => {
    const storedData = sessionStorage.getItem("create_story_data");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as StoryInputData;
        setStoryData(parsedData);
        
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

    return () => {
      setIsGenerating(false);
      setCancelRequested(true);
      if (bookGenerator) {
        bookGenerator.cancel();
      }
    };
  }, [navigate, resetGenerationState]);
  
  const updateProgress = (stage: string, percent: number) => {
    if (cancelRequested) return;
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  const generateStoryContent = async (data: StoryInputData) => {
    if (cancelRequested) return;
    
    setIsGenerating(true);
    setHasError(false);
    
    try {
      updateProgress("preparando", 10);
      
      const generator = new BookGenerationService(
        data,
        updateProgress,
        (message) => {
          setHasError(true);
          setErrorMessage(message);
          setIsGenerating(false);
        }
      );
      
      setBookGenerator(generator);
      
      updateProgress("gerando-historia", 20);
      
      const storyResult = await generator.generateStoryContent();
      
      if (cancelRequested) return;
      
      if (!storyResult) {
        throw new Error("Falha ao gerar o conteúdo da história");
      }
      
      setGeneratedStory(storyResult);
      updateProgress("revisao-historia", 50);
      setShowReview(true);
      setIsGenerating(false);
      
      console.log("Generated story content:", storyResult);
      
    } catch (error) {
      console.error("Error generating story:", error);
      
      if (cancelRequested) return;
      
      setHasError(true);
      setErrorMessage("Ocorreu um erro ao gerar a história. Use o botão abaixo para tentar novamente.");
      toast.error("Ocorreu um erro ao gerar a história. Por favor, tente novamente.");
      setIsGenerating(false);
    }
  };
  
  const continueWithImageGeneration = async () => {
    if (!storyData || !generatedStory || !bookGenerator) {
      console.error("Missing required data for image generation", {
        hasStoryData: !!storyData,
        hasGeneratedStory: !!generatedStory,
        hasBookGenerator: !!bookGenerator
      });
      return;
    }
    
    setShowReview(false);
    setIsGenerating(true);
    
    try {
      console.log("Starting image generation process...");
      const completeStory = await bookGenerator.generateCompleteStory();
      
      if (cancelRequested || !completeStory) {
        console.warn("Story generation cancelled or failed to create complete story");
        return;
      }
      
      updateProgress("finalizando", 95);
      
      console.log("Storing complete story data in sessionStorage:", completeStory);
      sessionStorage.setItem("storyData", JSON.stringify(completeStory));
      
      updateProgress("concluido", 100);
      
      setTimeout(() => {
        if (!cancelRequested) {
          console.log("Navigation to view-story page");
          navigate("/view-story");
          toast.success("História gerada com sucesso!");
        }
      }, 1000);
    } catch (error) {
      console.error("Error generating images:", error);
      
      if (cancelRequested) return;
      
      setHasError(true);
      setErrorMessage("Ocorreu um erro ao gerar as ilustrações. Use o botão abaixo para tentar novamente.");
      toast.error("Ocorreu um erro ao gerar as ilustrações. Por favor, tente novamente.");
      setIsGenerating(false);
    }
  };
  
  const handleEditStory = () => {
    if (!generatedStory) return;
    setEditTitle(generatedStory.title);
    setIsEditing(true);
  };
  
  const handleEditPage = (pageIndex: number) => {
    if (!generatedStory) return;
    setEditingPage(pageIndex);
    setEditPageText(generatedStory.content[pageIndex]);
  };
  
  const handleSaveTitle = () => {
    if (!generatedStory || !editTitle.trim()) return;
    
    setGeneratedStory({
      ...generatedStory,
      title: editTitle
    });
    
    setIsEditing(false);
    toast.success("Título atualizado com sucesso!");
  };
  
  const handleSavePage = () => {
    if (!generatedStory || editingPage === null || !editPageText.trim()) return;
    
    const updatedContent = [...generatedStory.content];
    updatedContent[editingPage] = editPageText;
    
    setGeneratedStory({
      ...generatedStory,
      content: updatedContent
    });
    
    setEditingPage(null);
    setEditPageText("");
    
    toast.success(`Página ${editingPage + 1} atualizada com sucesso!`);
  };
  
  const handleRetry = () => {
    if (storyData) {
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setProgress(0);
      setCurrentStage("preparando");
      setCancelRequested(false);
      
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
    if (bookGenerator) {
      bookGenerator.cancel();
    }
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
      case "revisao-historia": return <BookOpen className="h-12 w-12 text-indigo-500" />;
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
      case "revisao-historia": return "Revisão da história";
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
  
  if (showReview && generatedStory) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-5xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100"
            >
              <div className="p-8 border-b border-violet-100">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                    Revisar História
                  </h1>
                  
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditing(false)}
                        className="gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleSaveTitle}
                        className="gap-1"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleEditStory}
                      className="gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Título
                    </Button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="mb-6">
                    <Textarea 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Digite o título da história..."
                      className="font-bold text-lg"
                    />
                  </div>
                ) : (
                  <h2 className="text-xl md:text-2xl font-bold mb-4">
                    {generatedStory.title}
                  </h2>
                )}
                
                <p className="text-slate-600 mb-4">
                  Por favor, revise a história gerada abaixo. Você pode editar qualquer página antes de prosseguir com a geração das ilustrações.
                </p>
                
                <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-700 mb-6 flex items-start gap-2">
                  <Sparkles className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Personalize sua história!</p>
                    <p>Você pode editar o conteúdo de cada página clicando no botão "Editar" ao lado dela.</p>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-[60vh] border-b border-violet-100">
                <div className="p-8">
                  {generatedStory.content.map((pageText, index) => (
                    <div key={index} className="mb-8 last:mb-0">
                      {editingPage === index ? (
                        <div className="border border-violet-200 rounded-lg p-4 bg-violet-50">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold">Editando página {index + 1}</h3>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  setEditingPage(null);
                                  setEditPageText("");
                                }}
                                className="h-8"
                              >
                                Cancelar
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={handleSavePage}
                                className="h-8"
                              >
                                Salvar
                              </Button>
                            </div>
                          </div>
                          <Textarea 
                            value={editPageText}
                            onChange={(e) => setEditPageText(e.target.value)}
                            placeholder="Digite o texto da página..."
                            className="min-h-[120px]"
                          />
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-lg p-4 hover:border-violet-200 transition-colors group">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="inline-block bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 text-xs font-medium mb-2">
                                Página {index + 1}
                              </div>
                              <p className="text-slate-700">{pageText}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditPage(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 gap-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-8">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelAndReturn}
                    className="gap-2"
                  >
                    Cancelar e Voltar
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="default"
                      onClick={continueWithImageGeneration}
                      className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      <Wand2 className="h-4 w-4" />
                      Continuar com ilustrações
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }
  
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
                    Este processo pode levar alguns minutos enquanto criamos ilustrações personalizadas.
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
