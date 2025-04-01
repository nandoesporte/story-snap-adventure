
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, AlertTriangle, ImageIcon, Volume2, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import StoryForm, { StoryFormData } from "./StoryForm";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryGeneration } from "@/hooks/useStoryGeneration";
import { StoryStyle } from "@/services/BookGenerationService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type CreationStep = "details" | "generating" | "finalizing";

interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  image_url?: string;
  generation_prompt?: string;
}

const StoryCreator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<CreationStep>("details");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [storyGenerationStarted, setStoryGenerationStarted] = useState(false);
  const [connectionErrorCount, setConnectionErrorCount] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const { 
    generateCompleteStory,
    isGenerating, 
    progress, 
    currentStage,
    currentImageIndex,
    totalImages,
    generatingNarration,
    currentNarrationIndex,
    setPromptById
  } = useStoryGeneration();
  
  // Define saveStoryToSupabase before it's used
  const saveStoryToSupabase = useCallback(async (storyData: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.log("Usuário não autenticado, salvando apenas em sessão.");
        return null;
      }
      
      const { saveStoryImagesPermanently } = await import('@/lib/imageStorage');
      
      console.log("Saving story images permanently before database storage");
      const processedStoryData = await saveStoryImagesPermanently({
        ...storyData,
        id: uuidv4()
      });
      
      const storyToSave = {
        title: processedStoryData.title,
        cover_image_url: processedStoryData.coverImageUrl,
        character_name: processedStoryData.childName,
        character_age: processedStoryData.childAge,
        theme: processedStoryData.theme,
        setting: processedStoryData.setting,
        style: processedStoryData.style,
        user_id: userData.user.id,
        character_prompt: selectedCharacter?.generation_prompt || "",
        pages: processedStoryData.pages.map((page: any) => ({
          text: page.text,
          image_url: page.imageUrl || page.image_url
        }))
      };
      
      console.log("Salvando história no banco de dados:", storyToSave);
      
      let columnExists = false;
      try {
        const { data: columnData, error: columnError } = await supabase.rpc(
          'check_column_exists',
          { p_table_name: 'stories', p_column_name: 'character_prompt' }
        );
        
        columnExists = columnData === true;
        
        if (columnError) {
          console.warn("Erro ao verificar coluna character_prompt:", columnError);
        }
      } catch (checkError) {
        console.warn("Erro ao verificar existência da coluna:", checkError);
      }
      
      if (!columnExists) {
        console.warn("Coluna character_prompt não existe, removendo do objeto a salvar.");
        delete storyToSave.character_prompt;
      }
      
      const { data, error } = await supabase
        .from("stories")
        .insert(storyToSave)
        .select();
        
      if (error) {
        console.error("Erro ao salvar história no Supabase:", error);
        toast.error("Erro ao salvar história no banco de dados: " + error.message);
        return null;
      }
      
      console.log("História salva com sucesso no Supabase:", data);
      toast.success("História salva com sucesso!");
      
      return data[0]?.id;
    } catch (error: any) {
      console.error("Erro ao salvar história:", error);
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
      return null;
    }
  }, [selectedCharacter]);
  
  // Fix 1: Modified generateStory to prevent re-entry and maintain step state
  const generateStory = useCallback(async (data: StoryFormData) => {
    if (!data) {
      toast.error("Informações incompletas para gerar a história.");
      return;
    }
    
    // Prevent re-entry if already generating
    if (isGenerating || step === "generating" || step === "finalizing") {
      console.log("Story generation already in progress, preventing duplicate start");
      return;
    }
    
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiError("A chave da API OpenAI não está configurada. Configure-a nas configurações.");
      toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
      return;
    }
    
    if (!hasElevenLabsKey) {
      toast.warning("A chave da API ElevenLabs não está configurada. As narrações não serão geradas automaticamente.", {
        duration: 6000,
        action: {
          label: "Configurar",
          onClick: () => navigate("/settings")
        }
      });
    }
    
    // Fix 2: Set formSubmitted to prevent re-running the form submission
    setFormSubmitted(true);
    setStep("generating");
    
    try {
      if (selectedPromptId) {
        toast.info("Usando prompt personalizado para geração da história");
      }
      
      const characterPrompt = selectedCharacter?.generation_prompt || "";
      const characterName = selectedCharacter?.name || data.childName;
      
      const completeBook = await generateCompleteStory(
        characterName,
        data.childAge,
        data.theme,
        data.setting,
        data.moral,
        characterPrompt,
        data.length,
        data.readingLevel,
        data.language,
        imagePreview,
        "papercraft" as StoryStyle,
        data.voiceType
      );
      
      if (!completeBook) {
        throw new Error("Falha ao gerar o livro completo");
      }
      
      console.log("História gerada com sucesso:", {
        title: completeBook.title,
        coverImagePreview: completeBook.coverImageUrl.substring(0, 50) + "...",
        pagesCount: completeBook.pages.length,
        characterName: characterName
      });
      
      setStep("finalizing");
      toast.info("Salvando história no banco de dados...");
      
      const storyId = await saveStoryToSupabase({
        title: completeBook.title,
        coverImageUrl: completeBook.coverImageUrl,
        childName: data.childName,
        childAge: data.childAge,
        theme: data.theme,
        setting: data.setting,
        characterId: data.characterId,
        characterName: selectedCharacter?.name || data.childName,
        pages: completeBook.pages,
        language: data.language,
        style: "papercraft" as StoryStyle,
        moral: data.moral,
        readingLevel: data.readingLevel,
        voiceType: data.voiceType
      });
      
      try {
        const sessionData = {
          title: completeBook.title,
          coverImageUrl: completeBook.coverImageUrl,
          cover_image_url: completeBook.coverImageUrl,
          childImage: imagePreview,
          childName: data.childName,
          character_name: characterName,
          childAge: data.childAge,
          character_age: data.childAge,
          theme: data.theme,
          setting: data.setting,
          characterId: data.characterId,
          characterName: selectedCharacter?.name || data.childName,
          pages: completeBook.pages.map(page => ({
            text: page.text,
            imageUrl: page.imageUrl,
            image_url: page.imageUrl
          })),
          language: data.language,
          style: "papercraft" as StoryStyle,
          moral: data.moral,
          readingLevel: data.readingLevel,
          voiceType: data.voiceType
        };
        
        const maxLength = 5000000;
        const jsonString = JSON.stringify(sessionData);
        
        if (jsonString.length > maxLength) {
          const basicData = {
            ...sessionData,
            coverImageUrl: "/placeholder.svg",
            cover_image_url: "/placeholder.svg",
            pages: sessionData.pages.map(page => ({
              text: page.text,
              imageUrl: "/placeholder.svg",
              image_url: "/placeholder.svg"
            }))
          };
          sessionStorage.setItem("storyData", JSON.stringify(basicData));
          console.log("Dados muito grandes para sessionStorage, salvando versão reduzida");
        } else {
          sessionStorage.setItem("storyData", jsonString);
        }
      } catch (storageError) {
        console.warn("Erro ao salvar no sessionStorage (possível excesso de cota):", storageError);
      }
      
      sessionStorage.removeItem("create_story_data");
      
      // Fix 3: Corrigindo navegação após finalização com timeout
      setTimeout(() => {
        if (storyId) {
          navigate(`/story/${storyId}`);
        } else {
          navigate("/my-stories");
        }
      }, 1000);
      
    } catch (error: any) {
      console.error("Erro ao gerar história:", error);
      
      const errorMessage = error.message || "Erro desconhecido";
      if (errorMessage.includes("API key") || errorMessage.includes("401")) {
        toast.error("Erro na chave da API OpenAI. Verifique suas configurações.");
      } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        toast.error("Limite da API OpenAI excedido. Tente novamente mais tarde.");
      } else if (errorMessage.includes("Connection error") || errorMessage.includes("network")) {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        toast.error("Erro ao gerar história: " + errorMessage);
      }
      
      setStep("details");
      setFormSubmitted(false);
    }
  }, [
    navigate, 
    isGenerating, 
    step, 
    selectedPromptId, 
    selectedCharacter, 
    imagePreview, 
    generateCompleteStory, 
    saveStoryToSupabase,
    hasElevenLabsKey
  ]);
  
  // Load data from session storage 
  useEffect(() => {
    const loadSessionData = () => {
      try {
        const savedData = sessionStorage.getItem("create_story_data");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          if (parsedData) {
            // Set form data from session storage
            setFormData({
              childName: parsedData.childName || "",
              childAge: parsedData.childAge || "",
              theme: parsedData.theme || "adventure",
              setting: parsedData.setting || "forest",
              style: parsedData.style || "papercraft",
              length: parsedData.length || "medium",
              readingLevel: parsedData.readingLevel || "intermediate",
              language: parsedData.language || "portuguese",
              moral: parsedData.moral || "friendship",
              voiceType: parsedData.voiceType || "female",
              characterId: parsedData.characterId || undefined
            });
            
            setStoryPrompt(parsedData.storyPrompt || "");
            
            if (parsedData.selectedPromptId) {
              setSelectedPromptId(parsedData.selectedPromptId);
              setPromptById(parsedData.selectedPromptId);
            }
            
            // Flag that data is loaded
            setDataLoaded(true);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados da sessão:", error);
      }
    };
    
    loadSessionData();
    
    // Check for ElevenLabs key
    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    setHasElevenLabsKey(!!elevenLabsKey && elevenLabsKey !== 'undefined' && elevenLabsKey !== 'null');
    
  }, [setPromptById]);
  
  // Start generation automatically when form data is loaded
  useEffect(() => {
    if (dataLoaded && formData && !storyGenerationStarted && !formSubmitted) {
      console.log("Iniciando geração automática com dados carregados da sessão");
      setStoryGenerationStarted(true);
      
      // Fix 4: Adicionando delay para garantir que a interface carregue adequadamente
      setTimeout(() => {
        generateStory(formData);
      }, 500);
    }
  }, [dataLoaded, formData, generateStory, storyGenerationStarted, formSubmitted]);
  
  const setStoryPrompt = (prompt: string) => {
    // This function is intentionally empty to satisfy the interface
    // The actual prompt is saved to session storage
  };

  // Return to form
  const handleReturnToForm = () => {
    setStep("details");
    setFormSubmitted(false);
    setStoryGenerationStarted(false);
    
    // Fix 5: Limpeza adequada ao retornar ao formulário
    sessionStorage.removeItem("create_story_data");
  };

  // Handle form submission directly
  const handleFormSubmit = (data: StoryFormData) => {
    if (!formSubmitted) {
      generateStory(data);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="flex-1 container mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-4 md:p-8">
          {step === "details" && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                  Detalhes da História
                </h1>
                <p className="text-slate-600">
                  Personalize os detalhes para gerar sua história
                </p>
              </div>
              
              {apiError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription>
                    {apiError}
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                        Ir para Configurações
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <StoryForm onSubmit={handleFormSubmit} initialData={formData} />
            </div>
          )}

          {step === "generating" && (
            <div className="py-10 px-4">
              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
                  Gerando História Personalizada
                </h1>
                <p className="text-slate-600">
                  Estamos criando uma história mágica e única para você
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-6 py-8">
                <div className="relative w-full max-w-xl h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-600 to-indigo-600"
                    initial={{ width: "5%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                
                <p className="text-lg text-center text-violet-700 font-medium">
                  {currentStage}
                </p>
                
                {totalImages > 0 && (
                  <p className="text-sm text-gray-500">
                    {currentImageIndex > 0 ? (
                      <>Gerando ilustração {currentImageIndex} de {totalImages}</>
                    ) : (
                      <>Preparando geração de {totalImages} ilustrações</>
                    )}
                  </p>
                )}
                
                {generatingNarration && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Volume2 className="text-violet-600 h-5 w-5 animate-pulse" />
                    <p className="text-sm text-gray-500">
                      Gerando narração {currentNarrationIndex} de {totalImages}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-center mt-6">
                  <div className="relative">
                    <div className="w-24 h-24 flex items-center justify-center">
                      <LoadingSpinner size={80} />
                    </div>
                    
                    {/* Fallback button for errors */}
                    {connectionErrorCount >= 2 && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="mt-4 mx-auto" 
                        onClick={handleReturnToForm}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Cancelar e voltar
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-4 w-4 text-violet-500" />
                    <p className="text-sm text-gray-600">
                      {progress >= 50 ? "Preparando imagens usando estilo papercraft" : "Gerando texto da história"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <p className="text-sm text-gray-600">
                      Este processo pode levar alguns minutos
                    </p>
                  </div>
                  
                  {/* Fix 6: Adicionando link para configurações */}
                  {connectionErrorCount > 0 && (
                    <div className="flex items-center pt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-800" 
                        onClick={() => navigate("/settings")}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Verificar configurações
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {step === "finalizing" && (
            <div className="py-10 px-4">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-500 text-transparent bg-clip-text">
                  História Criada com Sucesso!
                </h1>
                <p className="text-slate-600">
                  Estamos finalizando os últimos detalhes...
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-6 py-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
                >
                  <Sparkles className="h-8 w-8 text-green-600" />
                </motion.div>
                
                <p className="text-lg text-center text-green-700 font-medium">
                  Salvando sua história...
                </p>
                
                <div className="flex justify-center">
                  <LoadingSpinner size={40} />
                </div>
                
                <p className="text-sm text-gray-500 max-w-md text-center">
                  Sua história está sendo salva. Você será redirecionado automaticamente em alguns instantes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;
