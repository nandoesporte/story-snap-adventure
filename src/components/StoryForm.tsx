import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReadingLevel, StoryLanguage, StoryLength, StoryMoral, StoryStyle, StoryTheme, StorySetting } from "@/services/BookGenerationService";

interface Character {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

export interface StoryFormData {
  childName: string;
  childAge: string;
  theme: StoryTheme;
  setting: StorySetting;
  style: StoryStyle;
  length: StoryLength;
  characterId: string;
  characterName: string;
  readingLevel: ReadingLevel;
  language: StoryLanguage;
  moral: StoryMoral;
}

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  initialData?: StoryFormData | null;
}

const StoryForm = ({ onSubmit, initialData }: StoryFormProps) => {
  // Form state
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [theme, setTheme] = useState<StoryTheme>("adventure");
  const [setting, setSetting] = useState<StorySetting>("forest");
  const [style, setStyle] = useState<StoryStyle>("cartoon");
  const [length, setLength] = useState<StoryLength>("medium");
  const [characterId, setCharacterId] = useState("");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("intermediate");
  const [language, setLanguage] = useState<StoryLanguage>("portuguese");
  const [moral, setMoral] = useState<StoryMoral>("friendship");
  
  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      setChildName(initialData.childName || "");
      setChildAge(initialData.childAge || "");
      setTheme(initialData.theme || "adventure");
      setSetting(initialData.setting || "forest");
      setStyle(initialData.style || "cartoon");
      setLength(initialData.length || "medium");
      setCharacterId(initialData.characterId || "");
      setReadingLevel(initialData.readingLevel || "intermediate");
      setLanguage(initialData.language || "portuguese");
      setMoral(initialData.moral || "friendship");
    }
  }, [initialData]);
  
  // Fetch characters from the database
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("id, name, description, image_url")
        .eq("is_active", true)
        .order("name");
        
      if (error) {
        console.error("Error fetching characters:", error);
        return [];
      }
      
      return data as Character[];
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!childName.trim()) {
      alert("Por favor, informe o nome da criança");
      return;
    }
    
    if (!childAge.trim()) {
      alert("Por favor, informe a idade da criança");
      return;
    }
    
    const selectedCharacter = characters?.find(char => char.id === characterId);
    const characterName = selectedCharacter?.name || "";
    
    onSubmit({
      childName,
      childAge,
      theme,
      setting,
      style,
      length,
      characterId,
      characterName,
      readingLevel,
      language,
      moral
    });
  };
  
  const themes: { id: StoryTheme; name: string }[] = [
    { id: "adventure", name: "Aventura" },
    { id: "fantasy", name: "Fantasia" },
    { id: "space", name: "Espaço" },
    { id: "ocean", name: "Oceano" },
    { id: "dinosaurs", name: "Dinossauros" }
  ];
  
  const settings: { id: StorySetting; name: string }[] = [
    { id: "forest", name: "Floresta Encantada" },
    { id: "castle", name: "Castelo Mágico" },
    { id: "space", name: "Espaço Sideral" },
    { id: "underwater", name: "Mundo Submarino" },
    { id: "dinosaurland", name: "Terra dos Dinossauros" }
  ];
  
  const styles: { id: StoryStyle; name: string }[] = [
    { id: "cartoon", name: "Desenho Animado" },
    { id: "watercolor", name: "Aquarela" },
    { id: "realistic", name: "Realista" },
    { id: "childrenbook", name: "Livro Infantil Clássico" },
    { id: "papercraft", name: "Papel e Recortes" }
  ];
  
  const lengths: { id: StoryLength; name: string }[] = [
    { id: "short", name: "Curta (5 páginas)" },
    { id: "medium", name: "Média (10 páginas)" },
    { id: "long", name: "Longa (15 páginas)" }
  ];
  
  const readingLevels: { id: ReadingLevel; name: string }[] = [
    { id: "beginner", name: "Iniciante (4-6 anos)" },
    { id: "intermediate", name: "Intermediário (7-9 anos)" },
    { id: "advanced", name: "Avançado (10-12 anos)" }
  ];
  
  const languages: { id: StoryLanguage; name: string }[] = [
    { id: "portuguese", name: "Português" },
    { id: "english", name: "Inglês" },
    { id: "spanish", name: "Espanhol" }
  ];
  
  const morals: { id: StoryMoral; name: string }[] = [
    { id: "friendship", name: "Amizade e Cooperação" },
    { id: "courage", name: "Coragem e Superação" },
    { id: "respect", name: "Respeito às Diferenças" },
    { id: "environment", name: "Cuidado com o Meio Ambiente" },
    { id: "honesty", name: "Honestidade e Verdade" },
    { id: "perseverance", name: "Perseverança e Esforço" }
  ];
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="childName">Nome da criança</Label>
          <Input
            id="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Ex: Sofia"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="childAge">Idade</Label>
          <Input
            id="childAge"
            value={childAge}
            onChange={(e) => setChildAge(e.target.value)}
            placeholder="Ex: 5 anos"
            className="mt-1"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="character">Personagem</Label>
        <Select 
          value={characterId} 
          onValueChange={(value) => setCharacterId(value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Selecione um personagem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum personagem</SelectItem>
            {characters?.map((character) => (
              <SelectItem 
                key={character.id} 
                value={character.id || "default-character"}
              >
                {character.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="theme">Tema</Label>
          <Select value={theme} onValueChange={(value) => setTheme(value as StoryTheme)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um tema" />
            </SelectTrigger>
            <SelectContent>
              {themes.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="setting">Cenário</Label>
          <Select value={setting} onValueChange={(value) => setSetting(value as StorySetting)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um cenário" />
            </SelectTrigger>
            <SelectContent>
              {settings.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="style">Estilo Visual</Label>
          <Select value={style} onValueChange={(value) => setStyle(value as StoryStyle)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um estilo" />
            </SelectTrigger>
            <SelectContent>
              {styles.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="length">Tamanho</Label>
          <Select value={length} onValueChange={(value) => setLength(value as StoryLength)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione um tamanho" />
            </SelectTrigger>
            <SelectContent>
              {lengths.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
        <h3 className="font-medium mb-4 flex items-center gap-1.5">Opções Adicionais</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="readingLevel" className="flex items-center gap-1.5 mb-1">
              <BookOpen className="h-3.5 w-3.5 text-violet-600" />
              Nível de Leitura
            </Label>
            <Select value={readingLevel} onValueChange={(value) => setReadingLevel(value as ReadingLevel)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o nível" />
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
            <Select value={language} onValueChange={(value) => setLanguage(value as StoryLanguage)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="moral" className="flex items-center gap-1.5 mb-1">
              <Award className="h-3.5 w-3.5 text-violet-600" />
              Moral da História
            </Label>
            <Select value={moral} onValueChange={(value) => setMoral(value as StoryMoral)}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione a moral" />
              </SelectTrigger>
              <SelectContent>
                {morals.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button
          type="submit"
          className="w-full px-6 py-3 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
        >
          Continuar
        </button>
      </div>
    </form>
  );
};

export default StoryForm;
