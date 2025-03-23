import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  AlertCircle, 
  Info, 
  Users, 
  Upload, 
  Image as ImageIcon, 
  PenTool, 
  Sparkles, 
  MessageSquare, 
  Book, 
  Wand2, 
  Bot
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import StoryCreationFlow from "@/components/StoryCreationFlow";
import { toast } from "sonner";
import StoryConfirmation from "@/components/StoryConfirmation";
import { useStoryBot } from "@/hooks/useStoryBot";

const themes = [
  { id: "adventure", name: "Aventura", icon: "🧭", description: "Explorações emocionantes em terras desconhecidas" },
  { id: "fantasy", name: "Fantasia", icon: "🧙‍♂️", description: "Mundos mágicos com criaturas extraordinárias" },
  { id: "space", name: "Espaço", icon: "🚀", description: "Viagens interestelares e planetas distantes" },
  { id: "ocean", name: "Oceano", icon: "🌊", description: "Descobertas nas profundezas do mar" },
  { id: "dinosaurs", name: "Dinossauros", icon: "🦖", description: "Aventuras na era pré-histórica" }
];

const settings = [
  { id: "forest", name: "Floresta Encantada", icon: "🌳", description: "Um lugar mágico cheio de segredos e criaturas mágicas" },
  { id: "castle", name: "Castelo Mágico", icon: "🏰", description: "Um castelo antigo com salões imensos e passagens secretas" },
  { id: "space", name: "Espaço Sideral", icon: "🪐", description: "Galáxias distantes, estrelas brilhantes e nebulosas coloridas" },
  { id: "underwater", name: "Mundo Submarino", icon: "🐠", description: "Recifes de coral vibrantes e misteriosas cavernas subaquáticas" },
  { id: "dinosaurland", name: "Terra dos Dinossauros", icon: "🦕", description: "Florestas antigas e vulcões ativos da era Jurássica" }
];

const lengthOptions = [
  { id: "short", name: "Curta", pages: "5 páginas", icon: "📄", description: "Histórias rápidas para momentos especiais" },
  { id: "medium", name: "Média", pages: "10 páginas", icon: "📑", description: "O tamanho perfeito para antes de dormir" },
  { id: "long", name: "Longa", pages: "15 páginas", icon: "📚", description: "Uma aventura completa com mais detalhes" }
];

const styleOptions = [
  { id: "cartoon", name: "Desenho Animado", icon: "🎨", description: "Ilustrações coloridas e estilo animado" },
  { id: "watercolor", name: "Aquarela", icon: "🖌️", description: "Estilo artístico com cores suaves e fluidas" },
  { id: "realistic", name: "Realista", icon: "🖼️", description: "Imagens com aparência mais próxima da realidade" },
  { id: "storybook", name: "Livro Infantil", icon: "📕", description: "Estilo clássico de ilustração de livros infantis" }
];

interface StoryData {
  childName: string;
  childAge: string;
  theme: string;
  themeName: string;
  setting: string;
  settingName: string;
  style: string;
  styleName: string;
  length: string;
  lengthName: string;
  characterId?: string;
  characterName?: string;
  imagePreview?: string | null;
}

const CreateStory = () => {
  const navigate = useNavigate();
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [showCharacterInfo, setShowCharacterInfo] = useState(true);
  const [currentTab, setCurrentTab] = useState("wizard");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const { apiAvailable } = useStoryBot();

  useEffect(() => {
    const hasApiIssue = localStorage.getItem("storybot_api_issue") === "true";
    setShowApiAlert(hasApiIssue);

    const characterInfoShown = localStorage.getItem("character_info_shown") === "true";
    setShowCharacterInfo(!characterInfoShown);
    
    if (!characterInfoShown) {
      localStorage.setItem("character_info_shown", "true");
    }

    const handleApiIssue = () => {
      setShowApiAlert(true);
      localStorage.setItem("storybot_api_issue", "true");
    };

    window.addEventListener("storybot_api_issue", handleApiIssue);
    
    return () => {
      window.removeEventListener("storybot_api_issue", handleApiIssue);
    };
  }, []);

  const handleDismissCharacterInfo = () => {
    setShowCharacterInfo(false);
  };

  const handleCreationComplete = (data: any) => {
    const theme = themes.find(t => t.id === data.theme);
    const setting = settings.find(s => s.id === data.setting);
    const style = styleOptions.find(s => s.id === data.style);
    const length = lengthOptions.find(l => l.id === data.length);
    
    const completeStoryData: StoryData = {
      ...data,
      themeName: theme?.name || "Aventura",
      settingName: setting?.name || "Floresta Encantada",
      styleName: style?.name || "Desenho Animado",
      lengthName: length?.name || "Média"
    };
    
    setStoryData(completeStoryData);
    setShowConfirmation(true);
  };

  const handleEditDetails = () => {
    setShowConfirmation(false);
  };

  const handleConfirmStory = () => {
    if (storyData) {
      sessionStorage.setItem("create_story_data", JSON.stringify(storyData));
      navigate("/story-creator");
    } else {
      toast.error("Dados da história incompletos. Por favor, tente novamente.");
    }
  };

  const resetApiIssue = () => {
    localStorage.removeItem("storybot_api_issue");
    setShowApiAlert(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-violet-700 to-indigo-600 text-transparent bg-clip-text">
              Criar História Personalizada
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Crie uma história mágica com personagens encantadores em apenas alguns passos simples.
            </p>
          </motion.div>
          
          {showCharacterInfo && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  Escolha entre os personagens exclusivos para viver aventuras incríveis em histórias personalizadas. 
                  <strong> Cada personagem tem características visuais consistentes que serão mantidas em todas as páginas da história!</strong>
                </span>
                <button 
                  onClick={handleDismissCharacterInfo}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Fechar
                </button>
              </AlertDescription>
            </Alert>
          )}
          
          {showApiAlert && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex justify-between items-center">
                <span>
                  Usando gerador de histórias local devido a limitações da API. A experiência será simplificada, mas ainda funcional.
                </span>
                <button 
                  onClick={resetApiIssue}
                  className="text-xs underline hover:text-red-700"
                >
                  Tentar novamente
                </button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100">
            <div className="story-creator-header">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Crie uma História Mágica</h2>
                <p className="text-white/80">Personalize cada detalhe e veja a magia acontecer</p>
              </div>
            </div>
            
            {showConfirmation && storyData ? (
              <div className="p-6">
                <StoryConfirmation 
                  storyDetails={storyData} 
                  onConfirm={handleConfirmStory}
                  onEdit={handleEditDetails}
                  apiAvailable={!showApiAlert && apiAvailable}
                />
              </div>
            ) : (
              <Tabs defaultValue="wizard" className="p-6" onValueChange={setCurrentTab}>
                <div className="flex justify-center mb-6">
                  <TabsList className="grid grid-cols-2 md:grid-cols-2 bg-violet-100">
                    <TabsTrigger value="wizard" className="data-[state=active]:bg-white">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Criação Guiada
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="data-[state=active]:bg-white">
                      <PenTool className="w-4 h-4 mr-2" />
                      Criação Avançada
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="wizard" className="mt-0">
                  <StoryCreationFlow onComplete={handleCreationComplete} />
                </TabsContent>
                
                <TabsContent value="advanced" className="mt-0">
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-violet-200 rounded-xl bg-violet-50">
                    <Bot className="w-12 h-12 text-violet-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Crie com StoryBot</h3>
                    <p className="text-slate-600 text-center mb-6 max-w-lg">
                      No modo avançado, você terá acesso completo ao StoryBot, onde poderá especificar exatamente como deseja que a história seja construída, com personagens consistentes em todas as páginas.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full mb-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
                        <MessageSquare className="w-5 h-5 text-violet-500 mb-2" />
                        <h4 className="font-medium mb-1">Interação por Chat</h4>
                        <p className="text-sm text-slate-500">Converse diretamente com o StoryBot</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-violet-100">
                        <Sparkles className="w-5 h-5 text-violet-500 mb-2" />
                        <h4 className="font-medium mb-1">Personalização Total</h4>
                        <p className="text-sm text-slate-500">Controle cada detalhe da história e dos personagens</p>
                      </div>
                    </div>
                    <Button 
                      variant="storyPrimary"
                      size="lg"
                      onClick={() => navigate("/storybot")}
                      className="gap-2"
                    >
                      Abrir StoryBot
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="p-6 pt-0">
              <div className="flex flex-col md:flex-row gap-4 border-t border-violet-100 pt-6 items-center justify-between">
                <div className="flex items-center text-slate-500 text-sm">
                  <Info className="w-4 h-4 mr-2" />
                  <span>Todas as histórias são armazenadas na sua conta por 30 dias</span>
                </div>
                
                <Button
                  variant="story"
                  onClick={() => {
                    if (currentTab === "wizard" && !showConfirmation) {
                      toast.info("Você precisa completar o assistente primeiro");
                    } else if (showConfirmation) {
                      handleEditDetails();
                    } else {
                      navigate("/storybot");
                    }
                  }}
                  className="w-full md:w-auto"
                >
                  Cancelar e Voltar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      <style>
        {`
        .story-creator-header {
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.8) 0%,
            rgba(99, 102, 241, 0.8) 100%
          );
          padding: 2rem 1rem;
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .story-creator-header::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.3;
        }
        `}
      </style>
    </div>
  );
};

export default CreateStory;
