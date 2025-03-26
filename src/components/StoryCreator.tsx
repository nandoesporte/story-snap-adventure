
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import FileUpload from "./FileUpload";
import StoryForm, { StoryFormData } from "./StoryForm";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import StoryBotChat from "./StoryBotChat";
import { useStoryBot } from "../hooks/useStoryBot";
import { supabase } from "@/lib/supabase";
import { generateStoryWithGPT4, generateStory } from "@/utils/storyGenerator";
import { BookGenerationService, StoryInputData } from "@/services/BookGenerationService";

type CreationStep = "photo" | "details" | "chat" | "generating";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type StoryPage = {
  text: string;
  imageUrl: string;
};

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
  const [step, setStep] = useState<CreationStep>("photo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("preparando");
  const { 
    generateStoryBotResponse, 
    generateImageDescription, 
    generateImage, 
    generateCoverImage, 
    convertImageToBase64,
    generateCompleteStory
  } = useStoryBot();

  useEffect(() => {
    // Tentar carregar os dados da história da sessionStorage
    const savedData = sessionStorage.getItem("create_story_data");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Formatar os dados para o formato do formulário
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
        
        // Se temos todos os dados necessários, já podemos iniciar a geração
        if (formattedData.childName && formattedData.theme && formattedData.setting) {
          setStep("chat");
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
            console.error("Error fetching character:", error);
            toast.error("Não foi possível carregar o personagem selecionado.");
            return;
          }
          
          setSelectedCharacter(data as Character);
        } catch (error) {
          console.error("Error fetching character:", error);
          toast.error("Erro ao buscar informações do personagem.");
        }
      } else {
        setSelectedCharacter(null);
      }
    };
    
    fetchCharacter();
  }, [formData?.characterId]);
  
  useEffect(() => {
    if (step === "chat" && formData) {
      let initialPrompt = `Olá StoryBot! Estou criando uma história para ${formData.childName}, que tem ${formData.childAge}. 
      Gostaria de uma história com tema de "${formData.theme === 'adventure' ? 'Aventura' : 
      formData.theme === 'fantasy' ? 'Fantasia' : 
      formData.theme === 'space' ? 'Espaço' : 
      formData.theme === 'ocean' ? 'Oceano' : 
      'Dinossauros'}" em um cenário de "${
        formData.setting === 'forest' ? 'Floresta Encantada' : 
        formData.setting === 'castle' ? 'Castelo Mágico' : 
        formData.setting === 'space' ? 'Espaço Sideral' : 
        formData.setting === 'underwater' ? 'Mundo Submarino' : 
        'Terra dos Dinossauros'
      }".`;
      
      if (selectedCharacter) {
        initialPrompt += `\n\nGostaria que a história incluísse o personagem ${selectedCharacter.name}.`;
        
        if (selectedCharacter.description) {
          initialPrompt += `\nDescrição do personagem: ${selectedCharacter.description}`;
        }
        
        if (selectedCharacter.personality) {
          initialPrompt += `\nPersonalidade: ${selectedCharacter.personality}`;
        }
        
        if (selectedCharacter.generation_prompt) {
          initialPrompt += `\n\nInformações adicionais para geração da história: ${selectedCharacter.generation_prompt}`;
        }
      }
      
      initialPrompt += `\n\nPode me ajudar a criar uma história incrível?`;
      
      handleSendMessage(initialPrompt);
    }
  }, [step, formData, selectedCharacter]);
  
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  
  const handleFormSubmit = (data: StoryFormData) => {
    setFormData(data);
    setStep("chat");
  };
  
  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      role: "user",
      content: message
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const botResponse = await generateStoryBotResponse(messages, message);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: botResponse
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating story bot response:", error);
      toast.error("Erro ao processar sua solicitação. Por favor, tente novamente.");
      
      const errorAssistantMessage: Message = {
        role: "assistant",
        content: "Desculpe, tive um problema ao gerar uma resposta. Vamos tentar algo diferente?"
      };
      
      setMessages(prev => [...prev, errorAssistantMessage]);
      
      const apiIssueEvent = new Event("storybot_api_issue");
      window.dispatchEvent(apiIssueEvent);
    }
  };
  
  const updateProgress = (stage: string, percent: number) => {
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  const generateFinalStory = async () => {
    if (!formData) {
      toast.error("Informações incompletas para gerar a história.");
      return;
    }
    
    setStep("generating");
    setIsGenerating(true);
    
    try {
      updateProgress("preparando", 10);
      
      // Preparar o prompt do personagem
      const characterPrompt = selectedCharacter?.generation_prompt || null;
      
      updateProgress("gerando-historia", 20);
      
      // Gerar a história completa em um fluxo sequencial
      const completeBook = await generateCompleteStory(
        formData.childName,
        formData.childAge,
        formData.theme,
        formData.setting,
        formData.moral,
        characterPrompt || "",
        formData.length,
        formData.readingLevel,
        formData.language,
        imagePreview,
        formData.style
      );
      
      updateProgress("concluido", 100);
      
      // Salvar o livro completo na sessionStorage para a visualização
      sessionStorage.setItem("storyData", JSON.stringify({
        title: completeBook.title,
        coverImageUrl: completeBook.coverImageUrl,
        childImage: imagePreview,
        childName: formData.childName,
        childAge: formData.childAge,
        theme: formData.theme,
        setting: formData.setting,
        characterId: formData.characterId,
        characterName: selectedCharacter?.name,
        pages: completeBook.pages
      }));
      
      toast.success("História gerada com sucesso!");
      navigate("/view-story");
    } catch (error: any) {
      console.error("Error generating final story:", error);
      toast.error(error.message || "Ocorreu um erro ao gerar a história final. Por favor, tente novamente.");
      setStep("chat");
      
      // Only dispatch API issue if it's a real API error, not a user cancellation
      if (!error.message?.includes("cancelada")) {
        const apiIssueEvent = new Event("storybot_api_issue");
        window.dispatchEvent(apiIssueEvent);
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="glass rounded-2xl p-8 md:p-12 shadow-xl">
        {step === "photo" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Adicione uma foto da criança
            </h2>
            <FileUpload
              onFileSelect={handleFileSelect}
              imagePreview={imagePreview}
            />
            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => imagePreview ? setStep("details") : toast.error("Por favor, adicione uma foto para continuar.")}
                className="px-6 py-2 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
              >
                Próximo
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {step === "details" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Personalize a história
            </h2>
            <StoryForm onSubmit={handleFormSubmit} initialData={formData} />
            
            <div className="mt-8 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("photo")}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
              >
                Voltar
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {step === "chat" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[500px] flex flex-col"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Converse com o StoryBot
            </h2>
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-storysnap-blue">
                    <img src={imagePreview} alt="Criança" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">Detalhes:</p>
                  <p className="text-sm text-slate-600">Nome: {formData?.childName}, Idade: {formData?.childAge}</p>
                  <p className="text-sm text-slate-600">Tema: {
                    formData?.theme === 'adventure' ? 'Aventura' : 
                    formData?.theme === 'fantasy' ? 'Fantasia' : 
                    formData?.theme === 'space' ? 'Espaço' : 
                    formData?.theme === 'ocean' ? 'Oceano' : 
                    'Dinossauros'
                  }, Cenário: {
                    formData?.setting === 'forest' ? 'Floresta Encantada' : 
                    formData?.setting === 'castle' ? 'Castelo Mágico' : 
                    formData?.setting === 'space' ? 'Espaço Sideral' : 
                    formData?.setting === 'underwater' ? 'Mundo Submarino' : 
                    'Terra dos Dinossauros'
                  }</p>
                  {selectedCharacter && (
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Personagem: {selectedCharacter.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 mb-6">
              <div className="border border-slate-200 rounded-lg p-4 h-[300px] overflow-y-auto mb-4">
                {messages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-storysnap-blue text-white' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem para o StoryBot..." 
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleSendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button 
                  className="px-4 py-2 bg-storysnap-blue text-white rounded-lg hover:bg-storysnap-blue/90"
                  onClick={() => {
                    const input = document.querySelector('input') as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSendMessage(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Enviar
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("details")}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
              >
                Voltar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateFinalStory}
                className="px-6 py-2 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
              >
                Finalizar e Gerar História
              </motion.button>
            </div>
          </motion.div>
        )}
        
        {step === "generating" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[400px] flex flex-col items-center justify-center"
          >
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-medium">Gerando a história personalizada...</p>
            <p className="text-slate-500 mb-4">{currentStage}</p>
            <div className="w-full max-w-md mb-8 bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-storysnap-blue h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-500">Isso pode levar alguns instantes. Estamos criando algo especial!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
