import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, User, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface StoryCreationFlowProps {
  onComplete: (data: any) => void;
}

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

const StoryCreationFlow: React.FC<StoryCreationFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [theme, setTheme] = useState("");
  const [setting, setSetting] = useState("");
  const [length, setLength] = useState("medium");
  const [style, setStyle] = useState("cartoon");
  const [characterId, setCharacterId] = useState("");

  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    }
  });

  const nextStep = () => {
    if (step === 1 && (!childName || !childAge)) {
      return;
    }
    if (step === 2 && !theme) {
      return;
    }
    if (step === 3 && !setting) {
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete({
      childName,
      childAge,
      theme,
      setting,
      length,
      style,
      characterId
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4, 5].map((stepNumber) => (
            <div 
              key={stepNumber}
              className={`flex flex-col items-center ${stepNumber < 5 ? "w-1/5" : ""}`}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step === stepNumber 
                    ? "bg-violet-600 text-white" 
                    : step > stepNumber 
                      ? "bg-green-500 text-white" 
                      : "bg-violet-100 text-violet-400"
                }`}
              >
                {step > stepNumber ? "✓" : stepNumber}
              </div>
              <div className={`text-xs text-center ${step === stepNumber ? "text-violet-600 font-medium" : "text-slate-500"}`}>
                {stepNumber === 1 && "Criança"}
                {stepNumber === 2 && "Tema"}
                {stepNumber === 3 && "Cenário"}
                {stepNumber === 4 && "Detalhes"}
                {stepNumber === 5 && "Personagem"}
              </div>
              {stepNumber < 5 && (
                <div className={`h-1 w-full mt-2 ${step > stepNumber ? "bg-green-500" : "bg-violet-100"}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {step === 1 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Sobre a criança</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="childName">Nome da criança</Label>
                <div className="relative">
                  <Input
                    id="childName"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Digite o nome da criança"
                    className="pl-10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 h-5 w-5" />
                </div>
              </div>
              <div>
                <Label htmlFor="childAge">Idade</Label>
                <div className="relative">
                  <Input
                    id="childAge"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="Digite a idade da criança"
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-400 h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Escolha um tema</h3>
            <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themes.map((item) => (
                <Label
                  key={item.id}
                  htmlFor={`theme-${item.id}`}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    theme === item.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
                  }`}
                >
                  <RadioGroupItem
                    value={item.id}
                    id={`theme-${item.id}`}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.description}</div>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Escolha um cenário</h3>
            <RadioGroup value={setting} onValueChange={setSetting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.map((item) => (
                <Label
                  key={item.id}
                  htmlFor={`setting-${item.id}`}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    setting === item.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
                  }`}
                >
                  <RadioGroupItem
                    value={item.id}
                    id={`setting-${item.id}`}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{item.icon}</div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.description}</div>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Detalhes da história</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Tamanho da história</h4>
                <RadioGroup value={length} onValueChange={setLength} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {lengthOptions.map((item) => (
                    <Label
                      key={item.id}
                      htmlFor={`length-${item.id}`}
                      className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all text-center ${
                        length === item.id
                          ? "border-violet-500 bg-violet-50"
                          : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={item.id}
                        id={`length-${item.id}`}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-violet-500">{item.pages}</div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Estilo de ilustração</h4>
                <RadioGroup value={style} onValueChange={setStyle} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {styleOptions.map((item) => (
                    <Label
                      key={item.id}
                      htmlFor={`style-${item.id}`}
                      className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all text-center ${
                        style === item.id
                          ? "border-violet-500 bg-violet-50"
                          : "border-slate-200 hover:border-violet-200 hover:bg-violet-50/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={item.id}
                        id={`style-${item.id}`}
                        className="sr-only"
                      />
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="font-medium text-sm">{item.name}</div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h3 className="text-xl font-bold mb-4">Escolha um personagem especial</h3>
            <p className="text-slate-600 mb-4">
              Selecione um personagem para acompanhar {childName} nesta aventura incrível!
            </p>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    characterId === "" ? "ring-2 ring-violet-500 bg-violet-50" : ""
                  }`}
                  onClick={() => setCharacterId("")}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-violet-500" />
                    </div>
                    <div>
                      <h4 className="font-bold">Sem personagem</h4>
                      <p className="text-sm text-slate-500">
                        {childName} será o único protagonista da história
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {characters?.map((character: any) => (
                  <Card 
                    key={character.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      characterId === character.id ? "ring-2 ring-violet-500 bg-violet-50" : ""
                    }`}
                    onClick={() => setCharacterId(character.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      {character.image_url ? (
                        <img 
                          src={character.image_url} 
                          alt={character.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-violet-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold">{character.name}</h4>
                        <p className="text-sm text-slate-500">
                          {character.description?.substring(0, 60)}
                          {character.description?.length > 60 ? "..." : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <Button
            variant="outline"
            onClick={prevStep}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        ) : (
          <div></div>
        )}
        
        {step < 5 ? (
          <Button
            variant="storyPrimary"
            onClick={nextStep}
            className="gap-2"
            disabled={(step === 1 && (!childName || !childAge)) || 
                     (step === 2 && !theme) || 
                     (step === 3 && !setting)}
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="storyPrimary"
            onClick={handleComplete}
            className="gap-2"
          >
            Finalizar <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StoryCreationFlow;
