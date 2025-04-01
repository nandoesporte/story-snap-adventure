import React, { useState, useEffect } from "react";
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
  const [step, setStep] = useState<CreationStep>("generating");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [hasElevenLabsKey, setHasElevenLabsKey] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  
  const { 
    generateCompleteStory,
    isGenerating, 
    progress, 
    currentStage,
    currentImageIndex,
    totalImages,
    generatingNarration,
    currentNarrationIndex
  } = useStoryGeneration();
  
  useEffect(() => {
    const elevenlabsApiKey = localStorage.getItem('elevenlabs_api_key');
    setHasElevenLabsKey(!!elevenlabsApiKey);
    
    const savedData = sessionStorage.getItem("create_story_data");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const formattedData: StoryFormData = {
          childName: parsedData.childName,
          childAge: parsedData.childAge,
          theme: parsedData.theme,
          setting: parsedData.setting,
          characterId: parsedData.characterId,
          characterName: parsedData.characterName,
          style: (parsedData.style as StoryStyle) || "papercraft",
          length: parsedData.length || "medium",
          readingLevel: parsedData.readingLevel || "intermediate",
          language: parsedData.language || "portuguese",
          moral: parsedData.moral || "friendship",
          voiceType: parsedData.voiceType || "female"
        };
        
        setFormData(formattedData);
        
        if (parsedData.imagePreview) {
          setImagePreview(parsedData.imagePreview);
        }
        
        if (parsedData.selectedPromptId) {
          setSelectedPromptId(parsedData.selectedPromptId);
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
        navigate("/create-story");
        toast.error("Dados da história inválidos. Por favor, comece novamente.");
      }
    } else {
      navigate("/create-story");
      toast.error("Dados da história não encontrados. Por favor, comece novamente.");
    }

    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiError("A chave da API OpenAI não está configurada. Por favor, configure-a nas configurações.");
    }
  }, [navigate]);
  
  useEffect(() => {
    const fetchCharacter = async () => {
      if (formData?.characterId) {
        try {
          const { data, error } = await supabase
            .from("characters")
            .select("*")
            .eq("id", formData.characterId)
            .single();
            
          if (error) {
            console.error("Erro ao buscar personagem:", error);
            toast.error("Não foi possível carregar o personagem selecionado.");
            return;
          }
          
          setSelectedCharacter(data as Character);
        } catch (error) {
          console.error("Erro ao buscar personagem:", error);
          toast.error("Erro ao buscar informações do personagem.");
        }
      } else {
        setSelectedCharacter(null);
      }
    };
    
    if (formData) {
      fetchCharacter();
    }
  }, [formData]);
  
  useEffect(() => {
    if (dataLoaded && formData && step === "generating" && !apiError) {
      if (selectedPromptId) {
        const { setPromptById } = useStoryGeneration;
        setPromptById(selectedPromptId).then(() => {
          console.log("Applied selected prompt:", selectedPromptId);
          generateStory(formData);
        }).catch(error => {
          console.error("Failed to set selected prompt:", error);
          generateStory(formData);
        });
      } else {
        generateStory(formData);
      }
    }
  }, [dataLoaded, formData, step, apiError, selectedPromptId]);
  
  const handleFormSubmit = (data: StoryFormData) => {
    const updatedData: StoryFormData = {
      ...data,
      style: "papercraft" as StoryStyle
    };
    setFormData(updatedData);
    generateStory(updatedData);
  };
  
  const saveStoryToSupabase = async (storyData: any) => {
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
  };
  
  const generateStory = async (data: StoryFormData) => {
    if (!data) {
      toast.error("Informações incompletas para gerar a história.");
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
      
      setTimeout(() => {
        if (storyId) {
          navigate(`/view-story/${storyId}`);
        } else {
          navigate("/view-story");
        }
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao gerar história final:", error);
      
      if (error.message && error.message.includes("API key")) {
        setApiError("A chave da API está incorreta ou inválida. Configure-a nas configurações.");
        toast.error("Erro na chave da API. Por favor, verifique suas configurações.");
      } else if (error.message && (error.message.includes("429") || error.message.includes("quota") || error.message.includes("limite"))) {
        setApiError("Limite de requisições ou quota excedida. Tente novamente mais tarde.");
        toast.error("Limite de requisições excedido. Por favor, tente novamente mais tarde.");
      } else {
        setApiError("Ocorreu um erro ao gerar a história. Tente novamente.");
        toast.error(error.message || "Ocorreu um erro ao gerar a história final. Por favor, tente novamente.");
      }
    }
  };
  
  if (apiError) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="glass rounded-2xl p-8 md:p-12 shadow-xl">
          <div className="min-h-[300px] flex flex-col items-center justify-center">
            <div className="mb-8 text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Falha na geração da história</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8">{apiError}</p>
            </div>
            
            <Alert variant="destructive" className="mb-6 max-w-md">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Problema com a API</AlertTitle>
              <AlertDescription>
                Para resolver este problema, você precisa configurar corretamente sua chave da API OpenAI nas configurações.
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/create-story")}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Voltar para criação
              </Button>
              
              <Button 
                variant="default"
                onClick={() => navigate("/settings")}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Ir para configurações
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="glass rounded-2xl p-8 md:p-12 shadow-xl">
        {step === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Personalize sua história
            </h2>
            
            {!hasElevenLabsKey && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium">Chave API ElevenLabs não configurada</p>
                  <p className="text-amber-700 text-sm">
                    Para ter narrações automáticas em suas histórias, configure a chave da API ElevenLabs nas configurações.
                  </p>
                </div>
              </div>
            )}
            
            <StoryForm onSubmit={handleFormSubmit} initialData={formData} />
          </motion.div>
        )}
        
        {(step === "generating" || step === "finalizing") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[400px] flex flex-col items-center justify-center"
          >
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-medium">
              {step === "finalizing" ? "História gerada com sucesso!" : "Gerando a história personalizada..."}
            </p>
            <p className="text-slate-500 mb-4">{currentStage}</p>
            
            {totalImages > 0 && currentImageIndex > 0 && (
              <div className="mb-4 w-full max-w-md">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Gerando ilustrações</span>
                  <span>{currentImageIndex} de {totalImages}</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-md">
                  <ImageIcon className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-indigo-700">Processando ilustração {currentImageIndex}...</span>
                </div>
              </div>
            )}
            
            {generatingNarration && (
              <div className="mb-4 w-full max-w-md">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Gerando narrações</span>
                  <span>{currentNarrationIndex} de {totalImages}</span>
                </div>
                <div className="flex items-center gap-2 bg-violet-50 px-4 py-2 rounded-md">
                  <Volume2 className="h-4 w-4 text-violet-500" />
                  <span className="text-sm text-violet-700">
                    Gerando narração para página {currentNarrationIndex}...
                    {!hasElevenLabsKey && " (Atenção: API Key não configurada)"}
                  </span>
                </div>
              </div>
            )}
            
            <div className="w-full max-w-md mb-8 bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-storysnap-blue h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {currentImageIndex > 0 && currentImageIndex === totalImages && progress < 100 && (
              <div className="w-full max-w-md mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Verificando qualidade das ilustrações. Isso pode levar alguns momentos adicionais para garantir que todas as imagens sejam geradas corretamente.
                </p>
              </div>
            )}
            
            {generatingNarration && (
              <div className="w-full max-w-md mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                <Volume2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  A geração de narrações pode levar algum tempo. Estamos processando cada página para criar narrações de alta qualidade. Por favor, aguarde.
                </p>
              </div>
            )}
            
            <p className="text-sm text-slate-500">
              {step === "finalizing" 
                ? "Redirecionando para visualização da história..." 
                : generatingNarration 
                  ? "Estamos gerando narrações para cada página da história. Isso proporcionará uma experiência de leitura mais completa!"
                  : "Estamos criando algo especial com a OpenAI! As ilustrações serão geradas persistentemente, garantindo qualidade em cada página."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
