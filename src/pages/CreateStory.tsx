
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryCreator from "../components/StoryCreator";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";

const CreateStory = () => {
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [showGeminiInfo, setShowGeminiInfo] = useState(true);

  useEffect(() => {
    // Check localStorage to see if we've already detected API issues
    const hasApiIssue = localStorage.getItem("storybot_api_issue") === "true";
    setShowApiAlert(hasApiIssue);

    // Check if we've already shown the Gemini info
    const geminiInfoShown = localStorage.getItem("gemini_info_shown") === "true";
    setShowGeminiInfo(!geminiInfoShown);
    
    // If showing for the first time, mark as shown
    if (!geminiInfoShown) {
      localStorage.setItem("gemini_info_shown", "true");
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

  const handleDismissGeminiInfo = () => {
    setShowGeminiInfo(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Criar História Personalizada
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Crie uma história mágica com seu filho como protagonista em apenas alguns passos simples.
            </p>
          </motion.div>
          
          {showGeminiInfo && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="flex justify-between items-center">
                <span>Utilizando Gemini 2.0 Flash para geração de imagens com alta coerência visual e consistência de personagens. Garantimos maior fidelidade à foto da criança em todas as páginas da história.</span>
                <button 
                  onClick={handleDismissGeminiInfo}
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
          
          <StoryCreator />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateStory;
