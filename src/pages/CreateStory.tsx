import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Sparkles, 
  MessageSquare,
  LogIn,
  AlertTriangle,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryPromptInput from "@/components/StoryPromptInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSubscription } from "@/hooks/useSubscription";

type CreationStep = "prompt" | "details";

const CreateStory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  const [step, setStep] = useState<CreationStep>("prompt");
  const [storyPrompt, setStoryPrompt] = useState<string>("");
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  // Verificar se o formulário já foi enviado anteriormente para evitar renderização duplicada
  useEffect(() => {
    const storedData = sessionStorage.getItem("create_story_data");
    // Se temos dados armazenados e o formulário já foi enviado, redirecionar diretamente
    if (storedData && formSubmitted) {
      navigate("/story-creator");
    }
  }, [formSubmitted, navigate]);

  // Verificar se a chave da API OpenAI está configurada
  useEffect(() => {
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiKeyError(true);
    } else {
      setApiKeyError(false);
    }
  }, []);
  
  const handlePromptSubmit = (prompt: string) => {
    // Verificar novamente a chave da API antes de prosseguir
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiKeyError(true);
      toast.error("A chave da API OpenAI não está configurada. Configure-a nas configurações.");
      return;
    }
    
    setStoryPrompt(prompt);
    setStep("details");
    
    // Pré-preencher o formulário com sugestões baseadas no prompt
    const suggestedTheme = getSuggestedTheme(prompt);
    const suggestedSetting = getSuggestedSetting(prompt);
    
    setFormData({
      childName: "",
      childAge: "",
      theme: suggestedTheme,
      setting: suggestedSetting,
      style: "papercraft",
      length: "medium",
      readingLevel: "intermediate",
      language: "portuguese",
      moral: "friendship",
      voiceType: "female"
    });
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
    // Verificar novamente a chave da API antes de prosseguir
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiKeyError(true);
      toast.error("A chave da API OpenAI não está configurada. Configure-a nas configurações.");
      return;
    }
    
    // Salvar dados no sessionStorage
    sessionStorage.setItem("create_story_data", JSON.stringify({
      ...data,
      storyPrompt
    }));
    
    // Marcar que o formulário foi submetido
    setFormSubmitted(true);
    
    // Redirecionar para o criador de histórias
    navigate("/story-creator");
  };
  
  // Not authenticated content
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-violet-600" />
                </div>
                <h1 className="text-3xl font-bold">Login Necessário</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para criar histórias personalizadas, você precisa estar conectado à sua conta.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar para Início
                  </Button>
                  <Button variant="storyPrimary" onClick={() => navigate("/auth")}>
                    Entrar na Conta
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Check if user has an active subscription
  if (!isLoadingSubscription && !hasActiveSubscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold">Assinatura Necessária</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para criar histórias personalizadas, você precisa ter uma assinatura ativa.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar para Início
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    onClick={() => navigate("/planos")}
                  >
                    Ver Planos de Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }
  
  const renderStep = () => {
    switch (step) {
      case "prompt":
        return (
          <>
            {apiKeyError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações para poder gerar histórias.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Ir para Configurações
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <StoryPromptInput 
              onSubmit={handlePromptSubmit} 
            />
          </>
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
            
            {apiKeyError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações para poder gerar histórias.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Ir para Configurações
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
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
