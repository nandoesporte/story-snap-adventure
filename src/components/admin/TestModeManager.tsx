import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookGenerationService } from "@/services/BookGenerationService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const TestModeManager = () => {
  const [childName, setChildName] = useState("Ana");
  const [childAge, setChildAge] = useState("7");
  const [theme, setTheme] = useState("adventure");
  const [setting, setSetting] = useState("forest");
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      toast.info("Gerando história de teste...");

      // Usamos o método de fallback diretamente, sem passar pela API da OpenAI
      const story = BookGenerationService.generateFallbackStory({
        title: `História para ${childName}`,
        character_name: childName,
        character_age: childAge,
        theme: theme,
        setting: setting,
        style: "papercraft",
        num_pages: 5
      });

      // Salvar a história gerada
      try {
        const savedStory = await BookGenerationService.saveStoryToDatabase(story);
        toast.success("História de teste gerada com sucesso!");
        
        // Navegar para a visualização da história
        if (savedStory && savedStory.id) {
          navigate(`/story/${savedStory.id}`);
        }
      } catch (error) {
        console.error("Erro ao salvar história:", error);
        toast.error("Não foi possível salvar a história no banco de dados, mas ela foi gerada em memória.");
        
        // Salvar em sessionStorage como fallback
        sessionStorage.setItem('current_story', JSON.stringify(story));
        
        // Adicionar à lista de histórias salvas na sessão
        const savedStoriesJson = sessionStorage.getItem('saved_stories') || '[]';
        const savedStories = JSON.parse(savedStoriesJson);
        savedStories.push(story);
        sessionStorage.setItem('saved_stories', JSON.stringify(savedStories));
        
        navigate('/story-creator');
      }
    } catch (error) {
      console.error("Erro ao gerar história de teste:", error);
      toast.error("Ocorreu um erro ao gerar a história de teste.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Modo de Teste</CardTitle>
        <CardDescription>
          Gere histórias de teste sem usar a API OpenAI. Útil para testar o sistema sem consumir créditos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="childName">Nome da Criança</Label>
            <Input
              id="childName"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Nome da criança"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childAge">Idade</Label>
            <Input
              id="childAge"
              value={childAge}
              onChange={(e) => setChildAge(e.target.value)}
              placeholder="Idade da criança"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Tema</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Selecione um tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adventure">Aventura</SelectItem>
                <SelectItem value="fantasy">Fantasia</SelectItem>
                <SelectItem value="space">Espaço</SelectItem>
                <SelectItem value="ocean">Oceano</SelectItem>
                <SelectItem value="dinosaurs">Dinossauros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="setting">Cenário</Label>
            <Select value={setting} onValueChange={setSetting}>
              <SelectTrigger id="setting">
                <SelectValue placeholder="Selecione um cenário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forest">Floresta</SelectItem>
                <SelectItem value="castle">Castelo</SelectItem>
                <SelectItem value="space">Espaço</SelectItem>
                <SelectItem value="underwater">Fundo do Mar</SelectItem>
                <SelectItem value="dinosaurland">Terra dos Dinossauros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? "Gerando..." : "Gerar História de Teste"}
        </Button>
      </CardFooter>
    </Card>
  );
};
