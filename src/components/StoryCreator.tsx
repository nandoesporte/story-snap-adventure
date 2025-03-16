import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import FileUpload from "./FileUpload";
import StoryForm, { StoryFormData } from "./StoryForm";
import { toast } from "sonner";
import LoadingSpinner from "./LoadingSpinner";
import StoryBotChat from "./StoryBotChat";
import { useStoryBot } from "../hooks/useStoryBot";

type CreationStep = "photo" | "details" | "chat" | "generating";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const StoryCreator = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<CreationStep>("photo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { generateStoryBotResponse } = useStoryBot();
  
  useEffect(() => {
    if (step === "chat" && formData) {
      const initialPrompt = `Olá StoryBot! Estou criando uma história para ${formData.childName}, que tem ${formData.childAge}. 
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
      }". Pode me ajudar a criar uma história incrível?`;
      
      handleSendMessage(initialPrompt);
    }
  }, [step, formData]);
  
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
      const summaryPrompt = `Por favor, finalize nossa história sobre ${formData.childName} no cenário de ${
        formData.setting === 'forest' ? 'Floresta Encantada' : 
        formData.setting === 'castle' ? 'Castelo Mágico' : 
        formData.setting === 'space' ? 'Espaço Sideral' : 
        formData.setting === 'underwater' ? 'Mundo Submarino' : 
        'Terra dos Dinossauros'
      }. Crie uma história completa com início, meio e fim, dividida em 5 páginas incluindo uma moral. Use o nome ${formData.childName} como personagem principal e crie um título criativo.`;
      
      const finalResponse = await generateStoryBotResponse(messages, summaryPrompt);
      
      const storyContent = parseStoryContent(finalResponse);
      
      sessionStorage.setItem("storyData", JSON.stringify({
        ...storyContent,
        childImage: imagePreview,
        childName: formData.childName,
        childAge: formData.childAge,
        theme: formData.theme,
        setting: formData.setting
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
    const lines = response.split('\n').filter(line => line.trim() !== '');
    
    const titleIndex = lines.findIndex(line => line.length > 15 && !line.startsWith('Página'));
    const title = titleIndex >= 0 ? lines[titleIndex].replace(/[""#*]/g, '').trim() : "História de " + formData?.childName;
    
    let content: string[] = [];
    
    const pageMarkers = lines.map((line, index) => 
      line.toLowerCase().includes('página') || line.includes('page') ? index : -1
    ).filter(index => index !== -1);
    
    if (pageMarkers.length >= 4) {
      for (let i = 0; i < pageMarkers.length; i++) {
        const startIdx = pageMarkers[i] + 1;
        const endIdx = i < pageMarkers.length - 1 ? pageMarkers[i + 1] : lines.length;
        
        const pageContent = lines.slice(startIdx, endIdx).join('\n').trim();
        if (pageContent) content.push(pageContent);
      }
    } else {
      const contentStart = titleIndex >= 0 ? titleIndex + 1 : 0;
      const remainingLines = lines.slice(contentStart);
      
      const moralIndex = remainingLines.findIndex(line => 
        line.toLowerCase().includes('moral') || 
        line.toLowerCase().includes('conclusão') ||
        line.toLowerCase().includes('fim')
      );
      
      let storyLines = remainingLines;
      let moralLines: string[] = [];
      
      if (moralIndex !== -1) {
        storyLines = remainingLines.slice(0, moralIndex);
        moralLines = remainingLines.slice(moralIndex);
      }
      
      const partSize = Math.ceil(storyLines.length / 4);
      for (let i = 0; i < 4; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, storyLines.length);
        const part = storyLines.slice(start, end).join('\n').trim();
        if (part) content.push(part);
      }
      
      if (moralLines.length > 0) {
        content.push(moralLines.join('\n').trim());
      } else if (content.length === 4) {
        content.push(`Página ${content.length + 1} da história de ${formData?.childName}.`);
      }
    }
    
    while (content.length < 5) {
      content.push(`Página ${content.length + 1} da história de ${formData?.childName}.`);
    }
    
    content = content.slice(0, 5);
    
    return { title, content };
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
                <div>
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
