import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Sparkles, 
  BookOpen, 
  ImageIcon, 
  Wand2, 
  Camera,
  FileText, 
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FileUpload from "@/components/FileUpload";
import StoryForm, { StoryFormData } from "@/components/StoryForm";
import StoryConfirmation from "@/components/StoryConfirmation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  StoryInputData, 
  BookGenerationService, 
  StoryTheme, 
  StorySetting, 
  StoryStyle, 
  StoryLength, 
  ReadingLevel, 
  StoryLanguage, 
  StoryMoral 
} from "@/services/BookGenerationService";
import { useStoryBot } from "@/hooks/useStoryBot";

type CreationStep = "photo" | "details" | "confirmation" | "generating";

const CreateStory = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<CreationStep>("photo");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>("preparando");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [cancelRequested, setCancelRequested] = useState(false);
  const { apiAvailable } = useStoryBot();

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };
  
  const handleFormSubmit = (data: StoryFormData) => {
    setFormData(data);
    setStep("confirmation");
  };
  
  const handleGenerateStory = async () => {
    if (!formData) {
      toast.error("Dados da história incompletos");
      return;
    }
    
    setStep("generating");
    setIsGenerating(true);
    setHasError(false);
    setCancelRequested(false);
    
    const storyInputData: StoryInputData = {
      childName: formData.childName,
      childAge: formData.childAge,
      theme: formData.theme as StoryTheme,
      setting: formData.setting as StorySetting,
      characterId: formData.characterId,
      characterName: formData.characterName,
      style: formData.style as StoryStyle,
      length: formData.length as StoryLength,
      imagePreview: imagePreview,
      readingLevel: formData.readingLevel as ReadingLevel,
      language: formData.language as StoryLanguage,
      moral: formData.moral as StoryMoral
    };
    
    sessionStorage.setItem("create_story_data", JSON.stringify(storyInputData));
    
    navigate("/story-creator");
  };
  
  const updateProgress = (stage: string, percent: number) => {
    if (cancelRequested) return;
    setCurrentStage(stage);
    setProgress(percent);
  };
  
  const handleCancel = () => {
    setCancelRequested(true);
    setIsGenerating(false);
    
    if (step === "photo" || step === "details" || step === "confirmation") {
      if (step === "details") {
        setStep("photo");
      } else if (step === "confirmation") {
        setStep("details");
      }
    } else {
      navigate("/");
      toast.info("Geração de história cancelada");
    }
  };
  
  const getStageIcon = () => {
    if (hasError) {
      return <AlertTriangle className="h-12 w-12 text-amber-500" />;
    }
    
    switch (currentStage) {
      case "preparando": return <BookOpen className="h-12 w-12 text-indigo-500" />;
      case "gerando-historia": return <FileText className="h-12 w-12 text-indigo-500" />;
      case "gerando-capa": return <ImageIcon className="h-12 w-12 text-indigo-500" />;
      case "gerando-ilustracoes": return <Wand2 className="h-12 w-12 text-indigo-500" />;
      case "concluido": return <CheckCircle className="h-12 w-12 text-emerald-500" />;
      default: return <Sparkles className="h-12 w-12 text-indigo-500" />;
    }
  };
  
  const getStageName = () => {
    if (hasError) {
      return "Encontramos um problema";
    }
    
    switch (currentStage) {
      case "preparando": return "Preparando sua história...";
      case "gerando-historia": return "Criando a narrativa...";
      case "gerando-capa": return "Desenhando a capa...";
      case "gerando-ilustracoes": return "Ilustrando as páginas...";
      case "finalizando": return "Finalizando sua história...";
      case "concluido": return "História completa!";
      default: 
        if (currentStage.startsWith("ilustracao-")) {
          const pageNum = currentStage.split("-")[1];
          return `Ilustrando página ${pageNum}...`;
        }
        return "Criando magia...";
    }
  };
  
  const renderStep = () => {
    switch (step) {
      case "photo":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Adicione uma foto da criança
            </h2>
            <FileUpload
              onFileSelect={handleFileSelect}
              imagePreview={imagePreview}
            />
            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => imagePreview ? setStep("details") : toast.error("Por favor, adicione uma foto para continuar.")}
                className="px-6 py-2 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Próximo
              </motion.button>
            </div>
          </motion.div>
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
            <StoryForm onSubmit={handleFormSubmit} />
            
            <div className="mt-8 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("photo")}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
              >
                Voltar
              </motion.button>
            </div>
          </motion.div>
        );
        
      case "confirmation":
        if (!formData) return null;
        
        return (
          <StoryConfirmation 
            storyDetails={{
              childName: formData.childName,
              childAge: formData.childAge,
              theme: formData.theme,
              themeName: getThemeName(formData.theme),
              setting: formData.setting,
              settingName: getSettingName(formData.setting),
              style: formData.style,
              styleName: formData.style ? getStyleName(formData.style) : undefined,
              length: formData.length,
              lengthName: formData.length ? getLengthName(formData.length) : undefined,
              characterId: formData.characterId,
              characterName: formData.characterName,
              imagePreview: imagePreview,
              readingLevel: formData.readingLevel,
              language: formData.language,
              moral: formData.moral
            }}
            onConfirm={handleGenerateStory}
            onEdit={() => setStep("details")}
            apiAvailable={apiAvailable}
          />
        );
        
      case "generating":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-[400px] flex flex-col items-center justify-center"
          >
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              <div className={`absolute inset-0 rounded-full ${hasError ? 'bg-amber-100' : 'bg-indigo-100'} ${!hasError && isGenerating ? 'animate-pulse' : ''}`}></div>
              {getStageIcon()}
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{getStageName()}</h2>
            
            {!hasError && (
              <>
                <p className="text-slate-500 mb-4">{progress}% concluído</p>
                
                <div className="w-full max-w-md mb-6">
                  <Progress value={progress} className="h-2.5" />
                </div>
              </>
            )}
            
            {hasError ? (
              <Alert variant="destructive" className="mt-4 max-w-md">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro de geração</AlertTitle>
                <AlertDescription>
                  {errorMessage || "Encontramos um problema ao gerar sua história. Por favor, tente novamente."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center max-w-md">
                <p className="text-sm text-slate-500">
                  {!apiAvailable ? 
                    "Usando gerador de histórias local para criar sua história rapidamente." :
                    "Este processo pode levar alguns minutos enquanto criamos ilustrações personalizadas."
                  }
                </p>
              </div>
            )}
            
            {hasError && (
              <div className="flex gap-4 mt-6">
                <Button 
                  onClick={() => {
                    setHasError(false);
                    setRetryCount(prev => prev + 1);
                  }}
                  variant="default"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </motion.div>
        );
    }
  };
  
  const getThemeName = (theme: string): string => {
    const themeMap: Record<string, string> = {
      adventure: "Aventura",
      fantasy: "Fantasia",
      space: "Espaço",
      ocean: "Oceano",
      dinosaurs: "Dinossauros"
    };
    return themeMap[theme] || theme;
  };

  const getSettingName = (setting: string): string => {
    const settingMap: Record<string, string> = {
      forest: "Floresta Encantada",
      castle: "Castelo Mágico",
      space: "Espaço Sideral",
      underwater: "Mundo Submarino",
      dinosaurland: "Terra dos Dinossauros"
    };
    return settingMap[setting] || setting;
  };

  const getStyleName = (style: string): string => {
    const styleMap: Record<string, string> = {
      cartoon: "Desenho Animado",
      watercolor: "Aquarela",
      realistic: "Realista",
      childrenbook: "Livro Infantil Clássico",
      papercraft: "Papel e Recortes"
    };
    return styleMap[style] || style;
  };

  const getLengthName = (length: string): string => {
    const lengthMap: Record<string, string> = {
      short: "Curta (5 páginas)",
      medium: "Média (10 páginas)",
      long: "Longa (15 páginas)"
    };
    return lengthMap[length] || length;
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
            
            {renderStep()}
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CreateStory;
