import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, AlertTriangle, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import StoryForm, { StoryFormData } from "./StoryForm";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryGeneration } from "@/hooks/useStoryGeneration";
import { StoryStyle } from "@/services/BookGenerationService";
import { useAuth } from "@/context/AuthContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

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
  const { user, loading } = useAuth();
  const [step, setStep] = useState<CreationStep>("details");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  const { 
    generateCompleteStory,
    isGenerating, 
    progress, 
    currentStage,
    currentImageIndex,
    totalImages
  } = useStoryGeneration();
  
  useEffect(() => {
    if (!loading && !user) {
      toast.error("Você precisa estar logado para criar histórias");
      navigate("/auth");
    }
  }, [user, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-t-4 border-violet-600 border-solid rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-violet-700 font-medium">Carregando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!user && !loading) {
    return null;
  }
  
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
          style: (parsedData.style as StoryStyle) || "papercraft",
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
    if (!openAiApiKey) {
      toast.error("A chave da API OpenAI não está configurada. Verifique nas configurações.");
      return;
    }
    
    setStep("generating");
    
    try {
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
        "papercraft" as StoryStyle
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
        readingLevel: data.readingLevel
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
          readingLevel: data.readingLevel
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="container max-w-4xl px-4">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8">
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
                
                <p className="text-sm text-slate-500">
                  {step === "finalizing" 
                    ? "Redirecionando para visualização da história..." 
                    : "Estamos criando algo especial com a OpenAI! As ilustrações serão geradas persistentemente, garantindo qualidade em cada página."}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StoryCreator;
