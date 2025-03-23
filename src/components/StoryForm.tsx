
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Sparkles, ChevronDown, ChevronUp, Settings, BookOpen, Globe, Award } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoryTheme, StorySetting, StoryStyle, StoryLength, ReadingLevel, StoryLanguage, StoryMoral } from "@/services/BookGenerationService";

export interface StoryFormData {
  childName: string;
  childAge: string;
  theme: StoryTheme;
  setting: StorySetting;
  characterId?: string;
  characterName?: string;
  characterPrompt?: string;
  style?: StoryStyle;
  length?: StoryLength;
  readingLevel?: ReadingLevel;
  language?: StoryLanguage;
  moral?: StoryMoral;
}

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
}

interface Character {
  id: string;
  name: string;
  description: string;
  generation_prompt?: string;
  image_url?: string;
}

const StoryForm = ({ onSubmit }: StoryFormProps) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childName: "",
    childAge: "",
    theme: "adventure",
    setting: "forest",
    characterId: "",
    characterName: "",
    characterPrompt: "",
    style: "cartoon", // Changed from "standard" to "cartoon" which is valid according to StoryStyle type
    length: "short",
    readingLevel: "intermediate",
    language: "portuguese",
    moral: "friendship"
  });
  
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters-for-story"],
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "characterId" && value) {
      const selectedCharacter = characters?.find(char => char.id === value);
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        characterPrompt: selectedCharacter?.generation_prompt || ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
  
  const styles = [
    { id: "cartoon", name: "Desenho Animado" },
    { id: "watercolor", name: "Aquarela" },
    { id: "realistic", name: "Realista" },
    { id: "childrenbook", name: "Livro Infantil Clássico" },
    { id: "papercraft", name: "Papel e Recortes" }
  ];
  
  const lengths = [
    { id: "short", name: "Curta (5 páginas)" },
    { id: "medium", name: "Média (10 páginas)" },
    { id: "long", name: "Longa (15 páginas)" }
  ];
  
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

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="characterId" className="block text-sm font-medium mb-1 flex items-center gap-2">
              Personagem Principal <Sparkles className="h-4 w-4 text-amber-500" />
            </label>
            <div className="relative">
              <select
                id="characterId"
                name="characterId"
                value={formData.characterId}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all appearance-none"
              >
                <option value="">Selecione um personagem</option>
                {isLoading ? (
                  <option disabled>Carregando personagens...</option>
                ) : characters && characters.length > 0 ? (
                  characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Nenhum personagem encontrado</option>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
            {formData.characterId && formData.characterPrompt && (
              <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-100">
                <div className="flex items-center gap-1 text-xs text-amber-700 mb-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Prompt de geração disponível para este personagem</span>
                </div>
                <p className="text-xs text-gray-600">{formData.characterPrompt}</p>
              </div>
            )}
          </div>
        
          <div>
            <label htmlFor="childName" className="block text-sm font-medium mb-1">
              Nome da criança
            </label>
            <input
              id="childName"
              name="childName"
              type="text"
              required
              value={formData.childName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all"
              placeholder="Ex: Sofia"
            />
          </div>
          
          <div>
            <label htmlFor="childAge" className="block text-sm font-medium mb-1">
              Idade
            </label>
            <input
              id="childAge"
              name="childAge"
              type="text"
              required
              value={formData.childAge}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all"
              placeholder="Ex: 5 anos"
            />
          </div>
          
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-100 mt-6 mb-2">
            <h3 className="text-sm font-medium text-violet-900 mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Opções Adicionais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="readingLevel" className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-violet-600" />
                  Nível de Leitura
                </Label>
                <Select
                  value={formData.readingLevel}
                  onValueChange={(value) => handleSelectChange("readingLevel", value)}
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
                <Label htmlFor="language" className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-violet-600" />
                  Idioma
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleSelectChange("language", value)}
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
                <Label htmlFor="moral" className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-violet-600" />
                  Moral da História
                </Label>
                <Select
                  value={formData.moral}
                  onValueChange={(value) => handleSelectChange("moral", value)}
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
          
          <div>
            <label htmlFor="theme" className="block text-sm font-medium mb-1">
              Tema da história
            </label>
            <div className="relative">
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all appearance-none"
              >
                {themes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="setting" className="block text-sm font-medium mb-1">
              Cenário
            </label>
            <div className="relative">
              <select
                id="setting"
                name="setting"
                value={formData.setting}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all appearance-none"
              >
                {settings.map(setting => (
                  <option key={setting.id} value={setting.id}>
                    {setting.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-3 px-4 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
        >
          Gerar História
        </motion.button>
      </div>
    </motion.form>
  );
};

export default StoryForm;
