
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

const CreateStory = () => {
  const navigate = useNavigate();
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [showCharacterInfo, setShowCharacterInfo] = useState(true);
  const [currentTab, setCurrentTab] = useState("wizard");

  useEffect(() => {
    // Check localStorage to see if we've already detected API issues
    const hasApiIssue = localStorage.getItem("storybot_api_issue") === "true";
    setShowApiAlert(hasApiIssue);

    // Check if we've already shown the Character info
    const characterInfoShown = localStorage.getItem("character_info_shown") === "true";
    setShowCharacterInfo(!characterInfoShown);
    
    // If showing for the first time, mark as shown
    if (!characterInfoShown) {
      localStorage.setItem("character_info_shown", "true");
    }

    // Listen for API issues
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
                <span>Agora com 10 personagens encantadores e únicos! Escolha seu favorito para viver aventuras incríveis em histórias personalizadas.</span>
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
              <AlertDescription>
                Usando gerador de histórias local devido a limitações da API. A experiência será simplificada, mas ainda funcional.
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
                <StoryCreationFlow />
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-0">
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-violet-200 rounded-xl bg-violet-50">
                  <Bot className="w-12 h-12 text-violet-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Crie com StoryBot</h3>
                  <p className="text-slate-600 text-center mb-6 max-w-lg">
                    No modo avançado, você terá acesso completo ao StoryBot, onde poderá especificar exatamente como deseja que a história seja construída.
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
                      <p className="text-sm text-slate-500">Controle cada detalhe da história</p>
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
            
            <div className="p-6 pt-0">
              <div className="flex flex-col md:flex-row gap-4 border-t border-violet-100 pt-6 items-center justify-between">
                <div className="flex items-center text-slate-500 text-sm">
                  <Info className="w-4 h-4 mr-2" />
                  <span>Todas as histórias são armazenadas na sua conta por 30 dias</span>
                </div>
                
                <Button
                  variant="story"
                  onClick={() => {
                    if (currentTab === "wizard") {
                      toast.info("Você precisa completar o assistente primeiro");
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
    </div>
  );
};

export default CreateStory;
