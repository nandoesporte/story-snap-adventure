
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
  const { generateStoryBotResponse, generateImageDescription, generateImage, generateCoverImage, convertImageToBase64 } = useStoryBot();
  
  // Fetch character data when formData changes
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
            return;
          }
          
          setSelectedCharacter(data as Character);
        } catch (error) {
          console.error("Error fetching character:", error);
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
      
      // Add character information if available
      if (selectedCharacter) {
        initialPrompt += `\n\nGostaria que a história incluísse o personagem ${selectedCharacter.name}.`;
        
        if (selectedCharacter.description) {
          initialPrompt += `\nDescrição do personagem: ${selectedCharacter.description}`;
        }
        
        if (selectedCharacter.personality) {
          initialPrompt += `\nPersonalidade: ${selectedCharacter.personality}`;
        }
        
        // Add generation prompt if available
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
      
      const apiIssueEvent = new Event("storybot_api_issue");
      window.dispatchEvent(apiIssueEvent);
    }
  };
  
  const generateFinalStory = async () => {
    if (!formData || !selectedFile || !imagePreview) {
      toast.error("Informações incompletas para gerar a história.");
      return;
    }
    
    setStep("generating");
    setIsGenerating(true);
    
    try {
      let summaryPrompt = `Por favor, finalize nossa história sobre ${formData.childName} no cenário de ${
        formData.setting === 'forest' ? 'Floresta Encantada' : 
        formData.setting === 'castle' ? 'Castelo Mágico' : 
        formData.setting === 'space' ? 'Espaço Sideral' : 
        formData.setting === 'underwater' ? 'Mundo Submarino' : 
        'Terra dos Dinossauros'
      }. Crie uma história completa com início, meio e fim, dividida em 10 páginas incluindo uma moral.`;
      
      // Add character information to the final prompt
      if (selectedCharacter) {
        summaryPrompt += ` A história deve incluir o personagem ${selectedCharacter.name} com as seguintes características: 
        ${selectedCharacter.description || ''} 
        ${selectedCharacter.personality ? `Personalidade: ${selectedCharacter.personality}` : ''}`;
        
        if (selectedCharacter.generation_prompt) {
          summaryPrompt += `\nUse as seguintes instruções específicas para criar a história: ${selectedCharacter.generation_prompt}`;
        }
      }
      
      summaryPrompt += `\n\nUse o nome ${formData.childName} como personagem principal e crie um título criativo. No começo da história, inicie claramente com "TITULO:" seguido do título da história, e em seguida separe cada página com "PAGINA 1:", "PAGINA 2:" etc. até "PAGINA 10:". Cada página deve ter apenas um parágrafo curto.`;
      
      const finalResponse = await generateStoryBotResponse(messages, summaryPrompt);
      
      const storyContentWithPages = parseStoryContent(finalResponse);
      
      // Converter a imagem da criança para base64 para referência de características
      const childImageBase64 = imagePreview;
      
      // Gerar a imagem de capa com referência à imagem da criança
      const coverImageDescription = await generateImageDescription(
        `Capa do livro infantil "${storyContentWithPages.title}" sobre ${formData.childName} em uma aventura em ${
          formData.setting === 'forest' ? 'uma Floresta Encantada' : 
          formData.setting === 'castle' ? 'um Castelo Mágico' : 
          formData.setting === 'space' ? 'o Espaço Sideral' : 
          formData.setting === 'underwater' ? 'um Mundo Submarino' : 
          'uma Terra dos Dinossauros'
        }${selectedCharacter ? ` com o personagem ${selectedCharacter.name}` : ''}`,
        formData.childName,
        formData.childAge,
        formData.theme,
        formData.setting
      );
      
      const coverImageUrl = await generateCoverImage(
        storyContentWithPages.title,
        formData.childName,
        formData.theme,
        formData.setting,
        childImageBase64 // Passando a imagem da criança para manter consistência
      );
      
      const pagesWithImages: StoryPage[] = [];
      
      toast.info("Gerando imagens para cada página da história...");
      
      // Gerar imagens para cada página com coerência visual entre elas
      for (const pageText of storyContentWithPages.content) {
        // Gerar uma descrição detalhada da imagem baseada no texto da página
        const imageDescription = await generateImageDescription(
          pageText + (selectedCharacter ? ` com o personagem ${selectedCharacter.name}` : ''),
          formData.childName,
          formData.childAge,
          formData.theme,
          formData.setting
        );
        
        // Gerar a imagem baseada na descrição, mantendo consistência com a imagem da criança
        const imageUrl = await generateImage(
          imageDescription,
          formData.childName,
          formData.theme,
          formData.setting,
          childImageBase64 // Passando a imagem da criança para consistência em todas as páginas
        );
        
        pagesWithImages.push({
          text: pageText,
          imageUrl: imageUrl
        });
      }
      
      // Salvar todos os dados da história para visualização
      sessionStorage.setItem("storyData", JSON.stringify({
        title: storyContentWithPages.title,
        coverImageUrl: coverImageUrl,
        childImage: imagePreview,
        childName: formData.childName,
        childAge: formData.childAge,
        theme: formData.theme,
        setting: formData.setting,
        characterId: formData.characterId,
        characterName: selectedCharacter?.name,
        pages: pagesWithImages
      }));
      
      navigate("/view-story");
    } catch (error) {
      console.error("Error generating final story:", error);
      toast.error("Ocorreu um erro ao gerar a história final. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const parseStoryContent = (response: string): { title: string; content: string[] } => {
    let cleanedResponse = response.replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '');
    
    const titleMatch = cleanedResponse.match(/TITULO:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `História de ${formData?.childName}`;
    
    const pageMatches = cleanedResponse.match(/PAGINA\s*\d+:\s*([\s\S]*?)(?=PAGINA\s*\d+:|$)/gi);
    
    let content: string[] = [];
    if (pageMatches && pageMatches.length > 0) {
      content = pageMatches.map(page => {
        return page.replace(/PAGINA\s*\d+:\s*/i, '')
          .replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '')
          .trim();
      });
    } else {
      const paragraphs = cleanedResponse.split('\n\n').filter(para => 
        para.trim().length > 0 && !para.match(/TITULO:/i)
      );
      
      content = paragraphs;
    }
    
    while (content.length < 10) {
      content.push(`A aventura de ${formData?.childName} continua...`);
    }
    
    return { title, content: content.slice(0, 10) };
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
            <StoryForm onSubmit={handleFormSubmit} />
            
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
            <p className="text-slate-500">Isso pode levar alguns instantes</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
