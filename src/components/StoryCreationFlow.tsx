import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileUpload from "./FileUpload";
import { 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  User, 
  CalendarDays, 
  Map, 
  Palette, 
  Book, 
  MessageSquare, 
  Sparkles,
  Upload
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { useStoryBot } from "../hooks/useStoryBot";
import { toast } from "sonner";

// Step types
type Step = 
  | "character" 
  | "childDetails" 
  | "theme" 
  | "setting" 
  | "length" 
  | "style" 
  | "review" 
  | "chat" 
  | "generating";

type StoryFormData = {
  childName: string;
  childAge: string;
  theme: string;
  themeName: string;
  setting: string;
  settingName: string;
  length: string;
  style: string;
  characterId: number;
};

// Personagens pré-estabelecidos
const characters = [
  { id: 1, name: "Luna, a Coelha Aventureira", image: "/placeholder.svg", description: "Coelha curiosa que adora explorar florestas mágicas" },
  { id: 2, name: "Leo, o Leãozinho Corajoso", image: "/placeholder.svg", description: "Pequeno leão que enfrenta seus medos com bravura" },
  { id: 3, name: "Pingo, o Pinguim Inventor", image: "/placeholder.svg", description: "Pinguim genial que cria bugigangas incríveis" },
  { id: 4, name: "Flora, a Fadinha das Flores", image: "/placeholder.svg", description: "Fada encantadora que cuida do jardim mágico" },
  { id: 5, name: "Rex, o Dinossauro Amigável", image: "/placeholder.svg", description: "Dino gentil que adora fazer novos amigos" },
  { id: 6, name: "Bolhas, o Peixinho Explorador", image: "/placeholder.svg", description: "Peixinho curioso que desvenda mistérios oceânicos" },
  { id: 7, name: "Ziggy, o Dragão Colorido", image: "/placeholder.svg", description: "Dragãozinho que muda de cor conforme seu humor" },
  { id: 8, name: "Mia, a Gatinha Astronauta", image: "/placeholder.svg", description: "Gata corajosa que viaja pelas estrelas" },
  { id: 9, name: "Tuck, a Tartaruga Sábia", image: "/placeholder.svg", description: "Tartaruga milenar cheia de histórias e conselhos" },
  { id: 10, name: "Zep, o Robozinho Curioso", image: "/placeholder.svg", description: "Robô adorável que aprende sobre emoções humanas" }
];

// Available options
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

type Message = {
  role: "user" | "assistant";
  content: string;
};

type StoryPage = {
  text: string;
  imageUrl: string;
};

const StoryCreationFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("character");
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<StoryFormData>({
    childName: "",
    childAge: "",
    theme: "adventure",
    themeName: "Aventura",
    setting: "forest",
    settingName: "Floresta Encantada",
    length: "medium",
    style: "cartoon",
    characterId: 0
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { generateStoryBotResponse, generateImageDescription, generateImage, generateCoverImage } = useStoryBot();

  const handleCharacterSelect = (characterId: number) => {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setSelectedCharacter(characterId);
      setImagePreview(character.image);
      setFormData(prev => ({ 
        ...prev, 
        characterId: characterId,
        childName: character.name.split(",")[0] // Use o primeiro nome do personagem
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectOption = (type: 'theme' | 'setting' | 'length' | 'style', id: string, name?: string) => {
    if (type === 'theme') {
      const selectedTheme = themes.find(t => t.id === id);
      setFormData(prev => ({ 
        ...prev, 
        theme: id,
        themeName: selectedTheme ? selectedTheme.name : ''
      }));
    } else if (type === 'setting') {
      const selectedSetting = settings.find(s => s.id === id);
      setFormData(prev => ({ 
        ...prev, 
        setting: id,
        settingName: selectedSetting ? selectedSetting.name : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [type]: id }));
    }
  };

  const handleGoNext = () => {
    if (currentStep === "character" && !selectedCharacter) {
      toast.error("Por favor, selecione um personagem para continuar.");
      return;
    }

    if (currentStep === "childDetails") {
      if (!formData.childAge.trim()) {
        toast.error("Por favor, informe a idade do personagem.");
        return;
      }
    }

    const stepOrder: Step[] = [
      "character", 
      "childDetails", 
      "theme", 
      "setting", 
      "length", 
      "style", 
      "review", 
      "chat", 
      "generating"
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      
      if (stepOrder[currentIndex + 1] === "chat") {
        initializeChatWithStoryBot();
      }
    }
  };

  const handleGoBack = () => {
    const stepOrder: Step[] = [
      "character", 
      "childDetails", 
      "theme", 
      "setting", 
      "length", 
      "style", 
      "review", 
      "chat", 
      "generating"
    ];
    
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const initializeChatWithStoryBot = async () => {
    const initialPrompt = `Olá StoryBot! Vou criar uma história para ${formData.childName}, que tem ${formData.childAge}. 
    A história será sobre ${formData.themeName} em um cenário de ${formData.settingName}. 
    ${formData.length === 'short' ? 'Será uma história curta (5 páginas)' : 
      formData.length === 'medium' ? 'Será uma história de tamanho médio (10 páginas)' : 
      'Será uma história longa (15 páginas)'} 
    com estilo visual de ${formData.style === 'cartoon' ? 'Desenho Animado' : 
      formData.style === 'watercolor' ? 'Aquarela' : 
      formData.style === 'realistic' ? 'Realista' : 
      formData.style === 'storybook' ? 'Livro Infantil' : ''
    }. Pode me ajudar a criar esta história?`;
    
    handleSendMessage(initialPrompt);
  };
  
  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      role: "user",
      content: message
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const botResponse = await generateStoryBotResponse(messages, message);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: botResponse
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating story bot response:", error);
      toast.error("Erro ao processar sua solicitação. Por favor, tente novamente.");
      
      const apiIssueEvent = new Event("storybot_api_issue");
      window.dispatchEvent(apiIssueEvent);
    }
  };

  const generateFinalStory = async () => {
    if (!formData || !selectedCharacter) {
      toast.error("Informações incompletas para gerar a história.");
      return;
    }
    
    setCurrentStep("generating");
    setIsGenerating(true);
    
    try {
      const pageCount = formData.length === 'short' ? 5 : formData.length === 'medium' ? 10 : 15;
      
      const summaryPrompt = `Por favor, finalize nossa história sobre ${formData.childName} no cenário de ${formData.settingName}. 
      Crie uma história completa com início, meio e fim, dividida em ${pageCount} páginas incluindo uma moral. 
      Use o nome ${formData.childName} como personagem principal e crie um título criativo. 
      No começo da história, inicie claramente com "TITULO:" seguido do título da história, 
      e em seguida separe cada página com "PAGINA 1:", "PAGINA 2:" etc. até "PAGINA ${pageCount}:". 
      Cada página deve ter apenas um parágrafo curto.`;
      
      const finalResponse = await generateStoryBotResponse(messages, summaryPrompt);
      
      const storyContentWithPages = parseStoryContent(finalResponse, pageCount);
      
      const characterImage = imagePreview;
      
      const coverImageUrl = await generateCoverImage(
        storyContentWithPages.title,
        formData.childName,
        formData.theme,
        formData.setting,
        characterImage
      );
      
      const pagesWithImages: StoryPage[] = [];
      
      toast.info("Gerando imagens para cada página da história...");
      
      for (const pageText of storyContentWithPages.content) {
        const imageDescription = await generateImageDescription(
          pageText,
          formData.childName,
          formData.childAge,
          formData.theme,
          formData.setting
        );
        
        const imageUrl = await generateImage(
          imageDescription,
          formData.childName,
          formData.theme,
          formData.setting,
          characterImage
        );
        
        pagesWithImages.push({
          text: pageText,
          imageUrl: imageUrl
        });
      }
      
      sessionStorage.setItem("storyData", JSON.stringify({
        title: storyContentWithPages.title,
        coverImageUrl: coverImageUrl,
        characterImage: imagePreview,
        childName: formData.childName,
        childAge: formData.childAge,
        theme: formData.theme,
        themeName: formData.themeName,
        setting: formData.setting,
        settingName: formData.settingName,
        style: formData.style,
        characterId: formData.characterId,
        pages: pagesWithImages
      }));
      
      navigate("/view-story");
    } catch (error) {
      console.error("Error generating final story:", error);
      toast.error("Ocorreu um erro ao gerar a história final. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const parseStoryContent = (response: string, pageCount: number): { title: string; content: string[] } => {
    let cleanedResponse = response.replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '');
    
    const titleMatch = cleanedResponse.match(/TITULO:\s*(.*?)(?:\r?\n|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : `História de ${formData.childName}`;
    
    const pageMatches = cleanedResponse.match(/PAGINA\s*\d+:\s*([\s\S]*?)(?=PAGINA\s*\d+:|$)/gi);
    
    let content: string[] = [];
    if (pageMatches && pageMatches.length > 0) {
      content = pageMatches.map(page => {
        return page.replace(/PAGINA\s*\d+:\s*/i, '')
          .replace(/ilustração:|illustration:|desenhe:|draw:|imagem:|image:|descrição visual:|visual description:|prompt de imagem:|image prompt:/gi, '')
          .trim();
      });
    } else {
      const paragraphs = cleanedResponse.split('\n\n').filter(para => 
        para.trim().length > 0 && !para.match(/TITULO:/i)
      );
      
      content = paragraphs;
    }
    
    while (content.length < pageCount) {
      content.push(`A aventura de ${formData.childName} continua...`);
    }
    
    content = content.slice(0, pageCount);
    
    return { title, content };
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "character":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Escolha um personagem</h3>
              <p className="text-slate-500 mt-2">Selecione um personagem para ser o protagonista da história</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {characters.map((character) => (
                <div 
                  key={character.id}
                  className={`story-option-card flex cursor-pointer transition-all ${selectedCharacter === character.id ? 'ring-2 ring-violet-500 bg-violet-50' : 'hover:bg-slate-50'}`}
                  onClick={() => handleCharacterSelect(character.id)}
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4 flex-shrink-0 bg-slate-200">
                    <img 
                      src={character.image} 
                      alt={character.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{character.name}</h4>
                    <p className="text-sm text-slate-500">{character.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
        
      case "childDetails":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Detalhes sobre o personagem</h3>
              <p className="text-slate-500 mt-2">Acrescente algumas informações sobre o personagem</p>
            </div>
            
            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <Label htmlFor="childName">Nome do personagem</Label>
                <Input 
                  id="childName"
                  name="childName"
                  placeholder="Ex: Luna"
                  value={formData.childName}
                  onChange={handleInputChange}
                  className="mt-1"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">O nome do personagem será mantido como no original</p>
              </div>
              
              <div>
                <Label htmlFor="childAge">Idade do personagem</Label>
                <Input 
                  id="childAge"
                  name="childAge"
                  placeholder="Ex: 7 anos"
                  value={formData.childAge}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
            </div>
            
            {selectedCharacter && (
              <div className="mt-4 flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-violet-300 bg-slate-100">
                  <img 
                    src={characters.find(c => c.id === selectedCharacter)?.image || ''} 
                    alt="Preview"
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
            )}
          </motion.div>
        );
        
      case "theme":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <Book className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Escolha o tema da história</h3>
              <p className="text-slate-500 mt-2">Selecione o tipo de aventura que {formData.childName} irá vivenciar</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div 
                  key={theme.id}
                  className={`story-option-card ${formData.theme === theme.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption('theme', theme.id, theme.name)}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">{theme.icon}</div>
                    <div>
                      <h4 className="font-medium">{theme.name}</h4>
                      <p className="text-sm text-slate-500">{theme.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
        
      case "setting":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Escolha o cenário</h3>
              <p className="text-slate-500 mt-2">Onde a aventura de {formData.childName} irá acontecer?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.map((setting) => (
                <div 
                  key={setting.id}
                  className={`story-option-card ${formData.setting === setting.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption('setting', setting.id, setting.name)}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">{setting.icon}</div>
                    <div>
                      <h4 className="font-medium">{setting.name}</h4>
                      <p className="text-sm text-slate-500">{setting.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
        
      case "length":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <Book className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Escolha o tamanho da história</h3>
              <p className="text-slate-500 mt-2">Quanto tempo você quer passar lendo com {formData.childName}?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lengthOptions.map((option) => (
                <div 
                  key={option.id}
                  className={`story-option-card ${formData.length === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption('length', option.id)}
                >
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <h4 className="font-medium">{option.name}</h4>
                    <p className="text-sm text-violet-500 font-medium">{option.pages}</p>
                    <p className="text-xs text-slate-500 mt-1">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
        
      case "style":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Escolha o estilo visual</h3>
              <p className="text-slate-500 mt-2">Como você gostaria que as ilustrações fossem criadas?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {styleOptions.map((option) => (
                <div 
                  key={option.id}
                  className={`story-option-card ${formData.style === option.id ? 'selected' : ''}`}
                  onClick={() => handleSelectOption('style', option.id)}
                >
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">{option.icon}</div>
                    <div>
                      <h4 className="font-medium">{option.name}</h4>
                      <p className="text-sm text-slate-500">{option.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
        
      case "review":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Revise os detalhes da história</h3>
              <p className="text-slate-500 mt-2">Verifique se está tudo como você deseja antes de prosseguir</p>
            </div>
            
            <div className="bg-violet-50 rounded-xl border border-violet-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  {selectedCharacter && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-violet-300 mr-4 bg-slate-100">
                      <img 
                        src={characters.find(c => c.id === selectedCharacter)?.image || ''} 
                        alt="Preview"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-lg">{formData.childName}</h4>
                    <p className="text-sm text-slate-500">{characters.find(c => c.id === selectedCharacter)?.description}</p>
                    <p className="text-sm text-slate-500">Idade: {formData.childAge}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{themes.find(t => t.id === formData.theme)?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">Tema: {formData.themeName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{settings.find(s => s.id === formData.setting)?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">Cenário: {formData.settingName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{lengthOptions.find(l => l.id === formData.length)?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">Tamanho: {
                        formData.length === 'short' ? 'Curta (5 páginas)' : 
                        formData.length === 'medium' ? 'Média (10 páginas)' : 
                        'Longa (15 páginas)'
                      }</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{styleOptions.find(s => s.id === formData.style)?.icon}</span>
                    <div>
                      <p className="text-sm font-medium">Estilo visual: {
                        formData.style === 'cartoon' ? 'Desenho Animado' : 
                        formData.style === 'watercolor' ? 'Aquarela' : 
                        formData.style === 'realistic' ? 'Realista' : 
                        formData.style === 'storybook' ? 'Livro Infantil' : ''
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col gap-2">
                <p className="font-medium">Detalhes da história:</p>
                <p className="text-sm text-slate-600">
                  {formData.childName} terá uma aventura de {formData.themeName} em {formData.settingName}.
                  As ilustrações serão em estilo {
                    formData.style === 'cartoon' ? 'Desenho Animado' : 
                    formData.style === 'watercolor' ? 'Aquarela' : 
                    formData.style === 'realistic' ? 'Realista' : 
                    formData.style === 'storybook' ? 'Livro Infantil' : ''
                  }.
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="story"
                onClick={handleGoBack}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Editar detalhes
              </Button>
              
              <Button
                variant="storyPrimary"
                onClick={handleGoNext}
                className="gap-2"
              >
                Conversar com StoryBot
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      case "chat":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 text-violet-600 mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Converse com o StoryBot</h3>
              <p className="text-slate-500 mt-2">Adicione mais detalhes ou faça perguntas para personalizar ainda mais a história</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="h-[300px] overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-violet-600 text-white' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-slate-200 p-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Digite sua mensagem para o StoryBot..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleSendMessage(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    variant="default"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="StoryBot"]') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleSendMessage(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="story"
                onClick={handleGoBack}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <Button
                variant="storyPrimary"
                onClick={generateFinalStory}
                className="gap-2"
              >
                Finalizar e Gerar História
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );
        
      case "generating":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-[400px] flex flex-col items-center justify-center"
          >
            <LoadingSpinner size="lg" />
            <p className="mt-6 text-lg font-medium">Gerando a história personalizada...</p>
            <p className="text-slate-500">Isso pode levar alguns instantes</p>
          </motion.div>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="glass rounded-2xl p-8 md:p-12 shadow-xl">
        <AnimatePresence mode="wait">
          {currentStep === "generating" ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[400px] flex flex-col items-center justify-center"
            >
              <LoadingSpinner size="lg" />
              <p className="mt-6 text-lg font-medium">Gerando a história personalizada...</p>
              <p className="text-slate-500">Isso pode levar alguns instantes</p>
            </motion.div>
          ) : (
            renderStepContent()
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoryCreationFlow;
