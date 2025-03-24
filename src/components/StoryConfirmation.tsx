
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookGenerationService } from "@/services/BookGenerationService";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface StoryDetails {
  childName: string;
  childAge: string;
  theme: string;
  themeName: string;
  setting: string;
  settingName: string;
  style?: string;
  styleName?: string;
  length?: string;
  lengthName?: string;
  characterId?: string;
  characterName?: string;
  imagePreview?: string | null;
  readingLevel?: string;
  language?: string;
  moral?: string;
}

interface StoryConfirmationProps {
  storyDetails: StoryDetails;
  onConfirm: () => void;
  onEdit: () => void;
  apiAvailable: boolean;
}

const readingLevelMap: { [key: string]: string } = {
  beginner: "Iniciante (4-6 anos)",
  intermediate: "Intermediário (7-9 anos)",
  advanced: "Avançado (10-12 anos)"
};

const languageMap: { [key: string]: string } = {
  portuguese: "Português",
  english: "Inglês",
  spanish: "Espanhol"
};

const moralMap: { [key: string]: string } = {
  friendship: "Amizade e Cooperação",
  courage: "Coragem e Superação",
  respect: "Respeito às Diferenças",
  environment: "Cuidado com o Meio Ambiente",
  honesty: "Honestidade e Verdade",
  perseverance: "Perseverança e Esforço"
};

const StoryConfirmation: React.FC<StoryConfirmationProps> = ({
  storyDetails,
  onConfirm,
  onEdit,
  apiAvailable
}) => {
  const [isApiAvailable, setIsApiAvailable] = useState(apiAvailable);
  const [apiKeyMessage, setApiKeyMessage] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Check API key status on component mount and when props change
  useEffect(() => {
    checkApiKey();
  }, [apiAvailable]);
  
  // Function to check API key status
  const checkApiKey = () => {
    const isGeminiAvailable = BookGenerationService.isGeminiApiKeyValid();
    setIsApiAvailable(isGeminiAvailable);
    
    // Get the API key to display in UI 
    const key = BookGenerationService.getGeminiApiKey();
    setApiKey(key);
    
    if (!isGeminiAvailable) {
      if (!key) {
        setApiKeyMessage("Nenhuma chave API Gemini configurada. Configure nas configurações para ativar todos os recursos.");
      } else if (key === 'undefined' || key === 'null') {
        setApiKeyMessage("Chave API Gemini inválida. Verifique as configurações.");
      } else {
        setApiKeyMessage("Erro ao conectar com a API Gemini. Verifique se a chave é válida nas configurações.");
      }
    } else {
      setApiKeyMessage(null);
    }
  };
  
  const handleConfirm = () => {
    if (!isApiAvailable) {
      toast.error("Configuração da API necessária", {
        description: "Configure a chave da API Gemini nas configurações para gerar histórias."
      });
      return;
    }
    onConfirm();
  };

  const handleSaveApiKey = () => {
    if (apiKey && apiKey.trim()) {
      const success = BookGenerationService.setGeminiApiKey(apiKey);
      if (success) {
        toast.success("Chave da API Gemini salva com sucesso");
        checkApiKey(); // Re-check API key status
      } else {
        toast.error("Erro ao salvar a chave da API");
      }
    } else {
      toast.error("Por favor, insira uma chave de API válida");
    }
  };

  return (
    <motion.div 
      className="max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Confirmar Detalhes da História</h2>
        <p className="text-slate-600">
          Verifique se os detalhes abaixo estão corretos antes de prosseguir
        </p>
      </div>
      
      {!isApiAvailable && (
        <Alert className="mb-6 border border-amber-200" variant="default">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex flex-col gap-2">
            <span className="font-semibold">Modo simplificado ativo:</span> {apiKeyMessage || "Configure uma chave API válida nas configurações para ativar todos os recursos."}
            
            <div className="flex items-center gap-2 mt-1">
              <Link to="/admin?tab=config" className="text-sm text-amber-700 hover:text-amber-900 underline flex items-center gap-1">
                <Settings className="h-3 w-3" /> 
                Ir para configurações
              </Link>
              <span className="text-sm text-slate-500">ou</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs border-amber-300 text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                onClick={handleSaveApiKey}
              >
                Usar esta chave: {apiKey}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {isApiAvailable && (
        <Alert className="mb-6 border border-emerald-200 bg-emerald-50" variant="default">
          <Info className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-700">
            <span className="font-semibold">API Gemini conectada:</span> Todos os recursos estão disponíveis.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-violet-50 border border-violet-100 rounded-xl overflow-hidden mb-6 shadow-sm">
        <div className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Detalhes da História
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-violet-700 mb-1">Personagem Principal</h4>
              <p className="text-slate-700 font-medium">
                {storyDetails.characterName || "Sem personagem específico"}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-violet-700 mb-1">Nome da Criança</h4>
              <p className="text-slate-700 font-medium">{storyDetails.childName}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-violet-700 mb-1">Idade</h4>
              <p className="text-slate-700 font-medium">{storyDetails.childAge}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-violet-700 mb-1">Tema</h4>
              <p className="text-slate-700 font-medium">{storyDetails.themeName}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="text-sm font-semibold text-violet-700 mb-1">Cenário</h4>
              <p className="text-slate-700 font-medium">{storyDetails.settingName}</p>
            </div>
            
            {storyDetails.style && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-semibold text-violet-700 mb-1">Estilo</h4>
                <p className="text-slate-700 font-medium">{storyDetails.styleName}</p>
              </div>
            )}
            
            {storyDetails.length && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-semibold text-violet-700 mb-1">Tamanho</h4>
                <p className="text-slate-700 font-medium">{storyDetails.lengthName}</p>
              </div>
            )}
          </div>
          
          {(storyDetails.readingLevel || storyDetails.language || storyDetails.moral) && (
            <div className="mt-4 pt-4 border-t border-violet-100">
              <h4 className="text-md font-semibold text-violet-700 mb-3">Opções Avançadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {storyDetails.readingLevel && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h5 className="text-sm font-semibold text-violet-700 mb-1">Nível de Leitura</h5>
                    <p className="text-slate-700 font-medium">{readingLevelMap[storyDetails.readingLevel] || storyDetails.readingLevel}</p>
                  </div>
                )}
                
                {storyDetails.language && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h5 className="text-sm font-semibold text-violet-700 mb-1">Idioma</h5>
                    <p className="text-slate-700 font-medium">{languageMap[storyDetails.language] || storyDetails.language}</p>
                  </div>
                )}
                
                {storyDetails.moral && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h5 className="text-sm font-semibold text-violet-700 mb-1">Moral da História</h5>
                    <p className="text-slate-700 font-medium">{moralMap[storyDetails.moral] || storyDetails.moral}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {storyDetails.imagePreview && (
            <div className="mt-4 pt-4 border-t border-violet-100 flex justify-center">
              <div className="relative w-32 h-32 mx-auto border-4 border-white rounded-full shadow-md overflow-hidden">
                <img 
                  src={storyDetails.imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button
          variant="outline"
          onClick={onEdit}
          className="px-6 py-3"
        >
          Editar Detalhes
        </Button>
        
        <Button
          variant="default"
          onClick={handleConfirm}
          className={`px-6 py-3 ${
            isApiAvailable
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              : "bg-gray-400 hover:bg-gray-500 cursor-not-allowed"
          }`}
          disabled={!isApiAvailable}
        >
          Gerar História com Ilustrações
        </Button>
      </div>
    </motion.div>
  );
};

export default StoryConfirmation;
