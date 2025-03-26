
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import StoryForm, { StoryFormData } from "./StoryForm";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryGeneration } from "@/hooks/useStoryGeneration";

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
  
  const { 
    generateCompleteStory,
    isGenerating, 
    progress, 
    currentStage
  } = useStoryGeneration();
  
  useEffect(() => {
    // Carregar dados do sessionStorage
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
          style: parsedData.style || "cartoon",
          length: parsedData.length || "medium",
          readingLevel: parsedData.readingLevel || "intermediate",
          language: parsedData.language || "portuguese",
          moral: parsedData.moral || "friendship"
        };
        
        setFormData(formattedData);
        
        if (parsedData.imagePreview) {
          setImagePreview(parsedData.imagePreview);
        }
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
      }
    }
  }, []);
  
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
    
    fetchCharacter();
  }, [formData?.characterId]);
  
  const handleFormSubmit = (data: StoryFormData) => {
    setFormData(data);
    generateStory(data);
  };
  
  const generateStory = async (data: StoryFormData) => {
    if (!data) {
      toast.error("Informações incompletas para gerar a história.");
      return;
    }
    
    // Verificar se a API key do OpenAI está configurada
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey) {
      toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
      return;
    }
    
    setStep("generating");
    
    try {
      // Obter prompt do personagem se disponível
      const characterPrompt = selectedCharacter?.generation_prompt || "";
      
      // Gerar a história completa
      const completeBook = await generateCompleteStory(
        data.childName,
        data.childAge,
        data.theme,
        data.setting,
        data.moral,
        characterPrompt,
        data.length,
        data.readingLevel,
        data.language,
        imagePreview,
        data.style
      );
      
      // Log para debug
      console.log("História gerada com sucesso:", {
        title: completeBook.title,
        coverImagePreview: completeBook.coverImageUrl.substring(0, 50) + "...",
        pagesCount: completeBook.pages.length
      });
      
      // Salvar os dados do livro completo para visualização
      sessionStorage.setItem("storyData", JSON.stringify({
        title: completeBook.title,
        coverImageUrl: completeBook.coverImageUrl,
        childImage: imagePreview,
        childName: data.childName,
        childAge: data.childAge,
        theme: data.theme,
        setting: data.setting,
        characterId: data.characterId,
        characterName: selectedCharacter?.name,
        pages: completeBook.pages,
        language: data.language,
        style: data.style,
        moral: data.moral,
        readingLevel: data.readingLevel
      }));
      
      setStep("finalizing");
      setTimeout(() => navigate("/view-story"), 1000);
    } catch (error: any) {
      console.error("Erro ao gerar história final:", error);
      toast.error(error.message || "Ocorreu um erro ao gerar a história final. Por favor, tente novamente.");
      setStep("details");
    }
  };
  
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
            <div className="w-full max-w-md mb-8 bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-storysnap-blue h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-500">
              {step === "finalizing" 
                ? "Redirecionando para visualização da história..." 
                : "Isso pode levar alguns instantes. Estamos criando algo especial!"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
