
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryBotChat from "../components/StoryBotChat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Wand2, BookText, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const StoryBot = () => {
  const navigate = useNavigate();
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [localGeneratorMode, setLocalGeneratorMode] = useState(false);
  
  useEffect(() => {
    // Check localStorage to see if we've already detected API issues
    const hasApiIssue = localStorage.getItem("storybot_api_issue") === "true";
    setShowApiAlert(hasApiIssue);
    setLocalGeneratorMode(hasApiIssue);
    
    // Listen for API issues
    const handleApiIssue = () => {
      setShowApiAlert(true);
      setLocalGeneratorMode(true);
      localStorage.setItem("storybot_api_issue", "true");
    };
    
    window.addEventListener("storybot_api_issue", handleApiIssue);
    
    return () => {
      window.removeEventListener("storybot_api_issue", handleApiIssue);
    };
  }, []);
  
  const handleGenerateStory = () => {
    if (localGeneratorMode) {
      toast.info("Gerando história usando o gerador local");
    } else {
      toast.info("Gerando história personalizada");
    }
    navigate("/view-story");
  };
  
  const clearApiIssueStatus = () => {
    // Reset API issue status for testing purposes
    localStorage.removeItem("storybot_api_issue");
    setShowApiAlert(false);
    setLocalGeneratorMode(false);
    toast.success("Status da API reiniciado");
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
              StoryBot
            </h1>
            <p className="text-slate-600 max-w-xl mx-auto">
              Converse com o StoryBot para criar histórias infantis personalizadas e mágicas.
            </p>
          </motion.div>
          
          {showApiAlert && (
            <Alert variant={localGeneratorMode ? "destructive" : "default"} className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {localGeneratorMode 
                  ? "Usando gerador de histórias local devido a limitações da API. A experiência será simplificada, mas ainda funcional."
                  : "Estamos com limitações técnicas no momento. Se encontrar dificuldades, tente ser mais específico em suas solicitações ou use o gerador guiado de histórias."}
              </AlertDescription>
            </Alert>
          )}
          
          {localGeneratorMode && (
            <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
              <Info className="h-4 w-4 text-amber-500" />
              <div>
                <AlertTitle>Modo de gerador local ativado</AlertTitle>
                <AlertDescription>
                  O StoryBot está funcionando com recursos locais limitados. As histórias serão geradas usando um modelo simplificado, 
                  mas ainda assim oferecem uma experiência divertida. Para uma experiência completa, volte mais tarde quando nossos 
                  serviços estiverem totalmente disponíveis.
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StoryBotChat />
            </div>
            
            <div>
              <div className="glass rounded-2xl p-6 md:p-8 shadow-xl mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-violet-600" />
                  Como usar o StoryBot
                </h2>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex gap-2">
                    <span className="bg-violet-100 text-violet-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                    <p>Informe o nome da criança e a idade.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-violet-100 text-violet-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                    <p>Escolha um tema para a história (aventura, fantasia, espaço, etc).</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-violet-100 text-violet-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                    <p>Descreva como você quer que o personagem principal seja.</p>
                  </li>
                  <li className="flex gap-2">
                    <span className="bg-violet-100 text-violet-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                    <p>Adicione elementos especiais para enriquecer a história.</p>
                  </li>
                </ul>
              </div>
              
              <div className="glass rounded-2xl p-6 md:p-8 shadow-xl">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <BookText className="w-5 h-5 text-violet-600" />
                    Gerar História Completa
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Quando terminar de definir os detalhes da história com o StoryBot, você pode gerar a história completa com todas as páginas e ilustrações.
                  </p>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={handleGenerateStory}
                      className={`w-full ${localGeneratorMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-storysnap-blue hover:bg-storysnap-blue/90'} text-white`}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {localGeneratorMode ? "Criar História com Gerador Local" : "Criar História Completa"}
                    </Button>
                  </div>
                  
                  {localGeneratorMode && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <p className="text-xs text-amber-700 mb-2">
                        O gerador local cria histórias simplificadas mas divertidas, usando recursos do seu dispositivo.
                      </p>
                      <button 
                        onClick={clearApiIssueStatus}
                        className="text-xs text-amber-600 hover:text-amber-800 underline"
                      >
                        Tentar usar a API novamente
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StoryBot;
