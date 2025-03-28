
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Sparkles, 
  MessageSquare
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryPromptInput from "@/components/StoryPromptInput";

type CreationStep = "prompt" | "details";

const CreateStory = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<CreationStep>("prompt");
  const [storyPrompt, setStoryPrompt] = useState<string>("");
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  
  const handlePromptSubmit = (prompt: string) => {
    setStoryPrompt(prompt);
    setStep("details");
    
    // Pré-preencher o formulário com sugestões baseadas no prompt
    const suggestedTheme = getSuggestedTheme(prompt);
    const suggestedSetting = getSuggestedSetting(prompt);
    
    setFormData(prevData => ({
      ...prevData,
      theme: suggestedTheme,
      setting: suggestedSetting,
    } as StoryFormData));
  };
  
  const getSuggestedTheme = (prompt: string): string => {
    const lowercasePrompt = prompt.toLowerCase();
    
    if (lowercasePrompt.includes("espaço") || lowercasePrompt.includes("planeta") || 
        lowercasePrompt.includes("foguete") || lowercasePrompt.includes("astronauta")) {
      return "space";
    } else if (lowercasePrompt.includes("dinossauro") || lowercasePrompt.includes("dino") || 
               lowercasePrompt.includes("pré-histórico")) {
      return "dinosaurs";
    } else if (lowercasePrompt.includes("oceano") || lowercasePrompt.includes("mar") || 
               lowercasePrompt.includes("sereia") || lowercasePrompt.includes("praia")) {
      return "ocean";
    } else if (lowercasePrompt.includes("magia") || lowercasePrompt.includes("fada") || 
               lowercasePrompt.includes("dragão") || lowercasePrompt.includes("mágico")) {
      return "fantasy";
    }
    
    // Default para aventura se nenhum tema específico for detectado
    return "adventure";
  };
  
  const getSuggestedSetting = (prompt: string): string => {
    const lowercasePrompt = prompt.toLowerCase();
    
    if (lowercasePrompt.includes("floresta") || lowercasePrompt.includes("bosque") || 
        lowercasePrompt.includes("árvore") || lowercasePrompt.includes("plantas")) {
      return "forest";
    } else if (lowercasePrompt.includes("castelo") || lowercasePrompt.includes("palácio") || 
               lowercasePrompt.includes("reino") || lowercasePrompt.includes("rei")) {
      return "castle";
    } else if (lowercasePrompt.includes("espaço") || lowercasePrompt.includes("planeta") || 
               lowercasePrompt.includes("foguete") || lowercasePrompt.includes("astronauta")) {
      return "space";
    } else if (lowercasePrompt.includes("oceano") || lowercasePrompt.includes("mar") || 
               lowercasePrompt.includes("submerso") || lowercasePrompt.includes("submarino")) {
      return "underwater";
    } else if (lowercasePrompt.includes("dinossauro") || lowercasePrompt.includes("dino") || 
               lowercasePrompt.includes("pré-histórico")) {
      return "dinosaurland";
    }
    
    // Default para floresta se nenhum cenário específico for detectado
    return "forest";
  };
  
  const handleFormSubmit = (data: StoryFormData) => {
    // Salvar dados no sessionStorage
    sessionStorage.setItem("create_story_data", JSON.stringify({
      ...data,
      storyPrompt
    }));
    
    // Redirecionar para o criador de histórias
    navigate("/story-creator");
  };
  
  const renderStep = () => {
    switch (step) {
      case "prompt":
        return (
          <StoryPromptInput 
            onSubmit={handlePromptSubmit} 
          />
        );
        
      case "details":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Personalize a história
            </h2>
            
            {storyPrompt && (
              <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-violet-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-violet-800 mb-1">Sua descrição</p>
                    <p className="text-sm text-violet-700">{storyPrompt}</p>
                  </div>
                </div>
              </div>
            )}
            
            <StoryForm onSubmit={handleFormSubmit} initialData={formData} />
            
            <div className="mt-8 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("prompt")}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
              >
                Voltar
              </motion.button>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
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
                Criar História Personalizada
              </h1>
              <p className="text-slate-600">
                Em apenas alguns passos, crie uma história mágica e personalizada
              </p>
            </div>
            
            <div className="flex justify-center mb-8">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === "prompt" ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className={`w-12 h-1 ${
                  step === "details" ? "bg-violet-600" : "bg-slate-200"
                }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step === "details" ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {renderStep()}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateStory;
