
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
  
  const saveStoryToSupabase = async (storyData: any) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.log("Usuário não autenticado, salvando apenas em sessão.");
        return null;
      }
      
      // Prepare story data for saving
      // Note: We're including character_prompt field now
      const storyToSave = {
        title: storyData.title,
        cover_image_url: storyData.coverImageUrl,
        character_name: storyData.childName,
        character_age: storyData.childAge,
        theme: storyData.theme,
        setting: storyData.setting,
        style: storyData.style,
        user_id: userData.user.id,
        character_prompt: selectedCharacter?.generation_prompt || "",
        pages: storyData.pages.map((page: any) => ({
          text: page.text,
          image_url: page.imageUrl
        }))
      };
      
      console.log("Salvando história no banco de dados:", storyToSave);
      
      // First verify if the character_prompt column exists
      let columnExists = false;
      try {
        const { data: columnData, error: columnError } = await supabase.rpc(
          'check_column_exists',
          { table_name: 'stories', column_name: 'character_prompt' }
        );
        
        columnExists = columnData === true;
        
        if (columnError) {
          console.warn("Erro ao verificar coluna character_prompt:", columnError);
          // If we can't verify, proceed anyway and let the insert attempt handle it
        }
      } catch (checkError) {
        console.warn("Erro ao verificar existência da coluna:", checkError);
      }
      
      // If column doesn't exist, remove the field from the data to save
      if (!columnExists) {
        console.warn("Coluna character_prompt não existe, removendo do objeto a salvar.");
        delete storyToSave.character_prompt;
      }
      
      // Insert story data
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
    if (!openAiApiKey) {
      toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
      return;
    }
    
    setStep("generating");
    
    try {
      const characterPrompt = selectedCharacter?.generation_prompt || "";
      
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
      
      console.log("História gerada com sucesso:", {
        title: completeBook.title,
        coverImagePreview: completeBook.coverImageUrl.substring(0, 50) + "...",
        pagesCount: completeBook.pages.length
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
        characterName: selectedCharacter?.name,
        pages: completeBook.pages,
        language: data.language,
        style: data.style,
        moral: data.moral,
        readingLevel: data.readingLevel
      });
      
      try {
        const sessionData = {
          title: completeBook.title,
          coverImageUrl: completeBook.coverImageUrl,
          cover_image_url: completeBook.coverImageUrl,
          childImage: imagePreview,
          childName: data.childName,
          character_name: data.childName,
          childAge: data.childAge,
          character_age: data.childAge,
          theme: data.theme,
          setting: data.setting,
          characterId: data.characterId,
          characterName: selectedCharacter?.name,
          pages: completeBook.pages.map(page => ({
            text: page.text,
            imageUrl: page.imageUrl,
            image_url: page.imageUrl
          })),
          language: data.language,
          style: data.style,
          moral: data.moral,
          readingLevel: data.readingLevel
        };
        
        const maxLength = 5000000; // ~5MB limite aproximado
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
      
      setTimeout(() => {
        if (storyId) {
          navigate(`/view-story/${storyId}`);
        } else {
          navigate("/view-story");
        }
      }, 1000);
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
