
import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase";
import { ChevronRight, ChevronLeft, Upload, Globe, BookOpen, Award } from "lucide-react";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import FileUpload from "./FileUpload";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  description: string;
  generation_prompt?: string;
  image_url?: string;
}

interface StoryCreationFlowProps {
  onComplete: (data: any) => void;
}

const StoryCreationFlow = ({ onComplete }: StoryCreationFlowProps) => {
  const [step, setStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [theme, setTheme] = useState("adventure");
  const [setting, setSetting] = useState("forest");
  const [length, setLength] = useState("medium");
  const [style, setStyle] = useState("cartoon");
  const [characterId, setCharacterId] = useState("");
  const [readingLevel, setReadingLevel] = useState("intermediate");
  const [language, setLanguage] = useState("portuguese");
  const [moral, setMoral] = useState("friendship");
  
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, description, generation_prompt, image_url")
        .eq("is_active", true)
        .order("name");
        
      if (error) {
        console.error("Error fetching characters:", error);
        return [];
      }
      
      return data as Character[];
    },
    staleTime: 60000, // 1 minute
  });
  
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
  
  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!childName.trim()) {
        toast.error("Por favor, informe o nome da criança.");
        return;
      }
      
      if (!childAge.trim()) {
        toast.error("Por favor, informe a idade da criança.");
        return;
      }
      
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      const selectedCharacter = characters?.find(char => char.id === characterId);
      const characterName = selectedCharacter?.name || "";
      const characterPrompt = selectedCharacter?.generation_prompt || "";
      
      onComplete({
        childName,
        childAge,
        theme,
        setting,
        style,
        length,
        characterId,
        characterName,
        characterPrompt,
        imagePreview,
        readingLevel,
        language,
        moral
      });
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const readingLevels = [
    { id: "beginner", name: "Iniciante (4-6 anos)" },
    { id: "intermediate", name: "Intermediário (7-9 anos)" },
    { id: "advanced", name: "Avançado (10-12 anos)" }
  ];
  
  const languages = [
    { id: "portuguese", name: "Português" },
    { id: "english", name: "Inglês" },
    { id: "spanish", name: "Espanhol" }
  ];
  
  const morals = [
    { id: "friendship", name: "Amizade e Cooperação" },
    { id: "courage", name: "Coragem e Superação" },
    { id: "respect", name: "Respeito às Diferenças" },
    { id: "environment", name: "Cuidado com o Meio Ambiente" },
    { id: "honesty", name: "Honestidade e Verdade" },
    { id: "perseverance", name: "Perseverança e Esforço" }
  ];
  
  const themes = [
    { id: "adventure", name: "Aventura" },
    { id: "fantasy", name: "Fantasia" },
    { id: "space", name: "Espaço" },
    { id: "ocean", name: "Oceano" },
    { id: "dinosaurs", name: "Dinossauros" }
  ];

  const settings = [
    { id: "forest", name: "Floresta Encantada" },
    { id: "castle", name: "Castelo Mágico" },
    { id: "space", name: "Espaço Sideral" },
    { id: "underwater", name: "Mundo Submarino" },
    { id: "dinosaurland", name: "Terra dos Dinossauros" }
  ];
  
  const lengthOptions = [
    { id: "short", name: "Curta (5 páginas)" },
    { id: "medium", name: "Média (10 páginas)" },
    { id: "long", name: "Longa (15 páginas)" }
  ];
  
  const styleOptions = [
    { id: "cartoon", name: "Desenho Animado" },
    { id: "watercolor", name: "Aquarela" },
    { id: "realistic", name: "Realista" },
    { id: "storybook", name: "Livro Infantil" }
  ];
  
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i}
              className={`w-3 h-3 rounded-full ${
                i + 1 === step ? 'bg-violet-600' : 
                i + 1 < step ? 'bg-violet-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-slate-500">
          Etapa {step} de 4
        </div>
      </div>
      
      <div className="min-h-[400px]">
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-medium mb-4">Escolha um personagem</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-2 text-center py-10">
                  <div className="animate-spin w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-500">Carregando personagens...</p>
                </div>
              ) : (
                <>
                  {characters && characters.map((character) => (
                    <div 
                      key={character.id}
                      onClick={() => setCharacterId(character.id)}
                      className={`
                        flex items-center p-4 border rounded-lg cursor-pointer transition-all
                        ${characterId === character.id 
                          ? 'border-violet-400 bg-violet-50 shadow-sm' 
                          : 'border-slate-200 hover:border-violet-200 hover:bg-violet-50/50'}
                      `}
                    >
                      {character.image_url ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-100 mr-4 flex-shrink-0 bg-violet-50">
                          <img 
                            src={character.image_url} 
                            alt={character.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mr-4 flex-shrink-0">
                          <span className="text-2xl text-violet-500">
                            {character.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{character.name}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {character.description}
                        </p>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 ml-2 flex-shrink-0 ${
                        characterId === character.id 
                          ? 'border-violet-500 bg-violet-500' 
                          : 'border-slate-300'
                      }`}>
                        {characterId === character.id && (
                          <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 13L10 16L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
        
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-medium mb-4">Detalhes da criança</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="childName">Nome da criança</Label>
                <input
                  id="childName"
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all mt-1"
                  placeholder="Ex: Sofia"
                />
              </div>
              
              <div>
                <Label htmlFor="childAge">Idade</Label>
                <input
                  id="childAge"
                  type="text"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all mt-1"
                  placeholder="Ex: 5 anos"
                />
              </div>
              
              <div className="pt-4">
                <Label htmlFor="photo" className="block mb-2">Adicione uma foto da criança (opcional)</Label>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  imagePreview={imagePreview}
                />
              </div>
              
              <div className="bg-violet-50 p-4 rounded-lg border border-violet-100 mt-6">
                <h4 className="font-medium text-violet-900 mb-3 flex items-center gap-1.5">
                  Opções Adicionais
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="readingLevel" className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                      Nível de Leitura
                    </Label>
                    <Select
                      value={readingLevel}
                      onValueChange={setReadingLevel}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Selecione o nível de leitura" />
                      </SelectTrigger>
                      <SelectContent>
                        {readingLevels.map(level => (
                          <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="language" className="flex items-center gap-1.5 mb-1">
                      <Globe className="h-3.5 w-3.5 text-violet-600" />
                      Idioma
                    </Label>
                    <Select
                      value={language}
                      onValueChange={setLanguage}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(language => (
                          <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="moral" className="flex items-center gap-1.5 mb-1">
                      <Award className="h-3.5 w-3.5 text-violet-600" />
                      Moral da História
                    </Label>
                    <Select
                      value={moral}
                      onValueChange={setMoral}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Selecione a moral" />
                      </SelectTrigger>
                      <SelectContent>
                        {morals.map(moral => (
                          <SelectItem key={moral.id} value={moral.id}>{moral.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-medium mb-4">Escolha o tema e cenário</h3>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="theme" className="block mb-2">Tema da história</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {themes.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setTheme(item.id)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all
                        ${theme === item.id 
                          ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                          : 'bg-white border border-slate-200 hover:border-violet-200 hover:bg-violet-50'}
                      `}
                    >
                      <div className="font-medium">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="setting" className="block mb-2">Cenário</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {settings.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSetting(item.id)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all
                        ${setting === item.id 
                          ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                          : 'bg-white border border-slate-200 hover:border-violet-200 hover:bg-violet-50'}
                      `}
                    >
                      <div className="font-medium">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-medium mb-4">Estilo e Tamanho</h3>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="style" className="block mb-2">Estilo de Ilustração</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {styleOptions.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setStyle(item.id)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all
                        ${style === item.id 
                          ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                          : 'bg-white border border-slate-200 hover:border-violet-200 hover:bg-violet-50'}
                      `}
                    >
                      <div className="font-medium">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="length" className="block mb-2">Tamanho da História</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {lengthOptions.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setLength(item.id)}
                      className={`
                        p-3 rounded-lg cursor-pointer transition-all
                        ${length === item.id 
                          ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                          : 'bg-white border border-slate-200 hover:border-violet-200 hover:bg-violet-50'}
                      `}
                    >
                      <div className="font-medium">{item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
        ) : (
          <div></div>
        )}
        
        <Button 
          variant="default"
          onClick={handleNext}
          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700"
          disabled={step === 1 && !characterId}
        >
          {step === 4 ? 'Concluir' : 'Próximo'}
          {step < 4 && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default StoryCreationFlow;
