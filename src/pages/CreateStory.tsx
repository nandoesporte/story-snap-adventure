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
import { useStoryBot } from "@/hooks/useStoryBot";

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
  const [availablePrompts, setAvailablePrompts] = useState<{id: string, name: string, description: string | null}[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    theme?: string;
    setting?: string;
    moral?: string;
  } | null>(null);
  const { generateStoryBotResponse, apiAvailable } = useStoryBot();

  useEffect(() => {
    const loadPrompts = async () => {
      setLoadingPrompts(true);
      try {
        const { listAvailablePrompts } = useStoryBot();
        const promptsList = await listAvailablePrompts();
        setAvailablePrompts(promptsList);
        
        const defaultPrompt = promptsList.find((p: any) => p.name === "Prompt Padrão");
        if (defaultPrompt) {
          setSelectedPromptId(defaultPrompt.id);
        }
      } catch (error) {
        console.error("Failed to load prompts:", error);
      } finally {
        setLoadingPrompts(false);
      }
    };
    
    loadPrompts();
  }, []);

  useEffect(() => {
    const storedData = sessionStorage.getItem("create_story_data");
    if (storedData && formSubmitted) {
      navigate("/story-creator");
    }
  }, [formSubmitted, navigate]);

  useEffect(() => {
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiKeyError(true);
    } else {
      setApiKeyError(false);
    }
  }, []);

  const getAISuggestions = async (prompt: string) => {
    if (!apiAvailable) {
      console.log("OpenAI API não está disponível");
      return null;
    }

    setLoadingSuggestions(true);
    try {
      const systemPrompt = "Analise o prompt do usuário para uma história infantil e extraia as informações para sugerir um tema, cenário e moral adequados. Responda apenas em formato JSON com os campos theme, setting e moral. Os valores válidos para theme são: adventure, fantasy, space, ocean, dinosaurs. Os valores válidos para setting são: forest, castle, space, underwater, dinosaurland. Os valores válidos para moral são: friendship, courage, honesty, kindness, perseverance.";
      
      const response = await generateStoryBotResponse([
        { role: "system", content: systemPrompt }
      ], prompt);
      
      console.log("AI response for suggestions:", response);
      
      try {
        // Tentar extrair JSON da resposta
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : null;
        
        if (jsonStr) {
          const suggestions = JSON.parse(jsonStr);
          return {
            theme: suggestions.theme || null,
            setting: suggestions.setting || null,
            moral: suggestions.moral || null
          };
        }
      } catch (parseError) {
        console.error("Erro ao analisar sugestões da IA:", parseError);
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao obter sugestões da IA:", error);
      return null;
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handlePromptSubmit = async (prompt: string) => {
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiKeyError(true);
      toast.error("A chave da API OpenAI não está configurada. Configure-a nas configurações.");
      return;
    }
    
    setStoryPrompt(prompt);
    
    // Obter sugestões da IA com base no prompt
    let suggestions = null;
    if (apiAvailable) {
      toast.info("Analisando seu prompt com IA para sugerir configurações...");
      suggestions = await getAISuggestions(prompt);
      setAiSuggestions(suggestions);
      
      if (suggestions) {
        toast.success("Sugestões de tema, cenário e moral geradas com base no seu prompt!");
      }
    }
    
    // Fallback para sugestões baseadas em palavras-chave se a IA falhar
    const suggestedTheme = suggestions?.theme || getSuggestedTheme(prompt);
    const suggestedSetting = suggestions?.setting || getSuggestedSetting(prompt);
    const suggestedMoral = suggestions?.moral || "friendship";
    
    setStep("details");
    
    setFormData({
      childName: "",
      childAge: "",
      theme: suggestedTheme,
      setting: suggestedSetting,
      style: "papercraft",
      length: "medium",
      readingLevel: "intermediate",
      language: "portuguese",
      moral: suggestedMoral,
      voiceType: "female"
    });
    
    // Store data in session for the second form
    sessionStorage.setItem("create_story_data", JSON.stringify({
      storyPrompt: prompt,
      theme: suggestedTheme,
      setting: suggestedSetting,
      moral: suggestedMoral,
      selectedPromptId
    }));
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
    
    return "forest";
  };

  const handleFormSubmit = (data: StoryFormData) => {
    const openAiApiKey = localStorage.getItem('openai_api_key');
    if (!openAiApiKey || openAiApiKey === 'undefined' || openAiApiKey === 'null' || openAiApiKey.trim() === '') {
      setApiKeyError(true);
      toast.error("A chave da API OpenAI não está configurada. Configure-a nas configurações.");
      return;
    }
    
    // Save all form data to session storage
    sessionStorage.setItem("create_story_data", JSON.stringify({
      ...data,
      storyPrompt,
      selectedPromptId
    }));
    
    setFormSubmitted(true);
    
    navigate("/story-creator");
  };

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
              availablePrompts={availablePrompts}
              selectedPromptId={selectedPromptId}
              onPromptSelect={setSelectedPromptId}
              loadingPrompts={loadingPrompts}
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
            
            {loadingSuggestions ? (
              <div className="flex justify-center items-center p-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
                  <p className="text-violet-700">Analisando seu prompt e gerando sugestões...</p>
                </div>
              </div>
            ) : (
              <>
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
                
                {aiSuggestions && (
                  <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-teal-800 mb-1">Sugestões da IA</p>
                        <p className="text-sm text-teal-700">
                          Com base na sua descrição, sugerimos:
                          {aiSuggestions.theme && (
                            <span className="block mt-1">
                              <strong>Tema:</strong> {aiSuggestions.theme === "adventure" ? "Aventura" : 
                                                   aiSuggestions.theme === "fantasy" ? "Fantasia" : 
                                                   aiSuggestions.theme === "space" ? "Espaço" : 
                                                   aiSuggestions.theme === "ocean" ? "Oceano" : 
                                                   aiSuggestions.theme === "dinosaurs" ? "Dinossauros" : aiSuggestions.theme}
                            </span>
                          )}
                          {aiSuggestions.setting && (
                            <span className="block">
                              <strong>Cenário:</strong> {aiSuggestions.setting === "forest" ? "Floresta Encantada" : 
                                                      aiSuggestions.setting === "castle" ? "Castelo Mágico" : 
                                                      aiSuggestions.setting === "space" ? "Espaço Sideral" : 
                                                      aiSuggestions.setting === "underwater" ? "Mundo Submarino" : 
                                                      aiSuggestions.setting === "dinosaurland" ? "Terra dos Dinossauros" : aiSuggestions.setting}
                            </span>
                          )}
                          {aiSuggestions.moral && (
                            <span className="block">
                              <strong>Moral:</strong> {aiSuggestions.moral === "friendship" ? "Amizade" : 
                                                    aiSuggestions.moral === "courage" ? "Coragem" : 
                                                    aiSuggestions.moral === "honesty" ? "Honestidade" : 
                                                    aiSuggestions.moral === "kindness" ? "Gentileza" : 
                                                    aiSuggestions.moral === "perseverance" ? "Perseverança" : aiSuggestions.moral}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedPromptId && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-indigo-800 mb-1">
                          Prompt selecionado: {availablePrompts.find(p => p.id === selectedPromptId)?.name}
                        </p>
                        <p className="text-sm text-indigo-700">
                          {availablePrompts.find(p => p.id === selectedPromptId)?.description || "Prompt personalizado para geração de histórias."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <StoryForm 
                  onSubmit={handleFormSubmit} 
                  initialData={formData} 
                  suggestions={aiSuggestions}
                />
              </>
            )}
            
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
