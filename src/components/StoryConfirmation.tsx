
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle, Sparkles, BookOpen, Edit2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StoryDetailsProps {
  childName: string;
  childAge: string;
  theme: string;
  themeName?: string;
  setting: string;
  settingName?: string;
  style?: string;
  styleName?: string;
  length?: string;
  lengthName?: string;
  characterId?: string;
  characterName?: string;
  imagePreview: string | null;
  readingLevel?: string;
  language?: string;
  moral?: string;
  storyPrompt?: string; // New field to display the user's story prompt
}

interface StoryConfirmationProps {
  storyDetails: StoryDetailsProps;
  onConfirm: () => void;
  onEdit: () => void;
  apiAvailable: boolean;
}

const StoryConfirmation = ({ 
  storyDetails, 
  onConfirm, 
  onEdit,
  apiAvailable = true
}: StoryConfirmationProps) => {
  const { 
    childName, 
    childAge, 
    themeName, 
    settingName, 
    styleName, 
    lengthName, 
    characterName,
    imagePreview,
    readingLevel,
    language,
    moral,
    storyPrompt
  } = storyDetails;
  
  const readingLevelNames: Record<string, string> = {
    beginner: "Iniciante (4-6 anos)",
    intermediate: "Intermediário (7-9 anos)",
    advanced: "Avançado (10-12 anos)"
  };
  
  const languageNames: Record<string, string> = {
    portuguese: "Português",
    english: "Inglês",
    spanish: "Espanhol"
  };
  
  const moralNames: Record<string, string> = {
    friendship: "Amizade e Cooperação",
    courage: "Coragem e Superação",
    respect: "Respeito às Diferenças",
    environment: "Cuidado com o Meio Ambiente",
    honesty: "Honestidade e Verdade",
    perseverance: "Perseverança e Esforço"
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">
        Confirme os detalhes da história
      </h2>
      
      <div className="bg-violet-50 rounded-lg p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">Personagem principal</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-100"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            {imagePreview && (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-200">
                <img src={imagePreview} alt={childName} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p><span className="font-medium">Nome:</span> {childName}</p>
              <p><span className="font-medium">Idade:</span> {childAge}</p>
              {characterName && (
                <p className="flex items-center text-amber-600">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  <span className="font-medium">Amigo especial:</span> {characterName}
                </p>
              )}
            </div>
          </div>
          
          {storyPrompt && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-violet-100">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-violet-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">Sua descrição da história</p>
                  <p className="text-sm text-slate-700">{storyPrompt}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <span className="font-medium">Tema:</span> {themeName}
          </div>
          <div>
            <span className="font-medium">Cenário:</span> {settingName}
          </div>
          {styleName && (
            <div>
              <span className="font-medium">Estilo:</span> {styleName}
            </div>
          )}
          {lengthName && (
            <div>
              <span className="font-medium">Tamanho:</span> {lengthName}
            </div>
          )}
          {readingLevel && (
            <div>
              <span className="font-medium">Nível de leitura:</span> {readingLevelNames[readingLevel] || readingLevel}
            </div>
          )}
          {language && (
            <div>
              <span className="font-medium">Idioma:</span> {languageNames[language] || language}
            </div>
          )}
          {moral && (
            <div>
              <span className="font-medium">Lição da história:</span> {moralNames[moral] || moral}
            </div>
          )}
        </div>
      </div>
      
      {!apiAvailable && (
        <Alert className="mt-4 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800">
            APIs de geração de conteúdo não estão disponíveis no momento. 
            Usaremos o gerador local para criar uma história rapidamente.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={onEdit}
        >
          Editar detalhes
        </Button>
        
        <Button
          onClick={onConfirm}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <BookOpen className="h-4 w-4" />
          Gerar História
        </Button>
      </div>
    </motion.div>
  );
};

export default StoryConfirmation;
