
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryBotChat from "../components/StoryBotChat";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Wand2, BookText, Download, Info, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useStoryBot } from "@/hooks/useStoryBot";

interface Character {
  id: string;
  name: string;
  description: string;
  generation_prompt?: string;
}

const StoryBot = () => {
  const navigate = useNavigate();
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [localGeneratorMode, setLocalGeneratorMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [selectedCharacterData, setSelectedCharacterData] = useState<Character | null>(null);
  const { useOpenAIForStories, setUseOpenAIForStories } = useStoryBot();
  
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
    
    // Load characters from Supabase
    fetchCharacters();
    
    return () => {
      window.removeEventListener("storybot_api_issue", handleApiIssue);
    };
  }, []);
  
  useEffect(() => {
    if (selectedCharacter) {
      const character = characters.find(c => c.id === selectedCharacter);
      setSelectedCharacterData(character || null);
    } else {
      setSelectedCharacterData(null);
    }
  }, [selectedCharacter, characters]);
  
  const fetchCharacters = async () => {
    try {
      setIsLoadingCharacters(true);
      const { data, error } = await supabase
        .from('characters')
        .select('id, name, description, generation_prompt');
      
      if (error) {
        console.error("Error fetching characters:", error);
        toast.error("Erro ao carregar personagens");
      } else {
        setCharacters(data || []);
      }
    } catch (err) {
      console.error("Error in fetchCharacters:", err);
    } finally {
      setIsLoadingCharacters(false);
    }
  };
  
  const handleGenerateStory = () => {
    if (localGeneratorMode) {
      toast.info("Gerando história usando o gerador local");
    } else {
      toast.info(useOpenAIForStories 
        ? "Gerando história com OpenAI GPT-4" 
        : "Gerando história com Google Gemini");
    }
    
    // Save selected character to localStorage for use in view-story page
    if (selectedCharacter) {
      localStorage.setItem("selected_character", selectedCharacter);
      const characterData = characters.find(c => c.id === selectedCharacter);
      if (characterData) {
        localStorage.setItem("character_prompt", characterData.generation_prompt || "");
        localStorage.setItem("character_name", characterData.name || "");
      }
    }
    
    navigate("/view-story");
  };
  
  const clearApiIssueStatus = () => {
    // Reset API issue status for testing purposes
    localStorage.removeItem("storybot_api_issue");
    localStorage.removeItem("leonardo_api_issue"); // Limpar também o status da API de imagens
    setShowApiAlert(false);
    setLocalGeneratorMode(false);
    toast.success("Status da API reiniciado");
    window.location.reload();
  };

  const toggleOpenAIUsage = () => {
    setUseOpenAIForStories(!useOpenAIForStories);
    toast.success(useOpenAIForStories 
      ? "Usando Google Gemini para geração de histórias" 
      : "Usando OpenAI GPT-4 para geração de histórias");
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
            
            <div className="mt-4 flex justify-center">
              <button 
                onClick={toggleOpenAIUsage}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  useOpenAIForStories 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${useOpenAIForStories ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                <span>{useOpenAIForStories ? 'Usando OpenAI GPT-4' : 'Usando Google Gemini'}</span>
              </button>
            </div>
            
            {useOpenAIForStories && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Usando OpenAI GPT-4 para histórias</span>
              </div>
            )}
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
                    <p>Selecione um personagem ou descreva um personalizado.</p>
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
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="character" className="text-sm font-medium">Selecione um personagem</Label>
                      <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Escolha um personagem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum personagem</SelectItem>
                          {characters.map(character => (
                            <SelectItem key={character.id} value={character.id}>
                              {character.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCharacterData && (
                        <div className="mt-2 text-xs text-violet-600 space-y-1">
                          <div className="flex items-start gap-1">
                            <User className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span><strong>{selectedCharacterData.name}</strong> será o protagonista da história</span>
                          </div>
                          
                          {selectedCharacterData.description && (
                            <p className="ml-4 text-slate-600">{selectedCharacterData.description}</p>
                          )}
                          
                          {selectedCharacterData.generation_prompt && (
                            <div className="ml-4 flex items-start gap-1">
                              <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                              <span className="text-blue-600">Prompt especial para ilustrações será usado</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-slate-600 text-sm">
                      Quando terminar de definir os detalhes da história com o StoryBot, você pode gerar a história completa com todas as páginas e ilustrações.
                    </p>
                  
                    <div className="pt-2">
                      <Button 
                        onClick={handleGenerateStory}
                        className={`w-full ${localGeneratorMode ? 'bg-amber-500 hover:bg-amber-600' : useOpenAIForStories ? 'bg-blue-600 hover:bg-blue-700' : 'bg-storysnap-blue hover:bg-storysnap-blue/90'} text-white`}
                      >
                        {useOpenAIForStories && !localGeneratorMode ? (
                          <Sparkles className="w-4 h-4 mr-2" />
                        ) : (
                          <Wand2 className="w-4 h-4 mr-2" />
                        )}
                        {localGeneratorMode 
                          ? "Criar História com Gerador Local" 
                          : useOpenAIForStories 
                            ? "Criar História com GPT-4"
                            : "Criar História Completa"}
                      </Button>
                    </div>
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
