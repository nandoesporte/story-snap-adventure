import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";
import { generateImageWithOpenAI } from "@/lib/openai";
import LeonardoAIStatusCheck from "./LeonardoAIStatusCheck";

const ImageGenerationManager = () => {
  const [leonardoApiKey, setLeonardoApiKey] = useState<string>("");
  const [useLeonardoAI, setUseLeonardoAI] = useState<boolean>(true);
  const [useOpenAI, setUseOpenAI] = useState<boolean>(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [testImageUrl, setTestImageUrl] = useState<string>("");

  useEffect(() => {
    // Load saved preferences
    const savedKey = localStorage.getItem("leonardo_api_key") || "";
    const savedUseLeonardo = localStorage.getItem("use_leonardo_ai") !== "false";
    const savedUseOpenAI = localStorage.getItem("use_openai_for_images") === "true";

    setLeonardoApiKey(savedKey);
    setUseLeonardoAI(savedUseLeonardo);
    setUseOpenAI(savedUseOpenAI);
  }, []);

  const handleSaveLeonardoAPI = () => {
    try {
      if (leonardoApiKey && leonardoApiKey.trim().length > 10) {
        localStorage.setItem("leonardo_api_key", leonardoApiKey.trim());
        localStorage.removeItem("leonardo_api_issue");
        toast.success("Chave API da Leonardo AI salva com sucesso!");
      } else {
        toast.error("A chave API é inválida. Por favor, insira uma chave válida.");
      }
    } catch (error) {
      console.error("Error saving Leonardo API key:", error);
      toast.error("Erro ao salvar a chave API da Leonardo AI.");
    }
  };

  const handleResetLeonardoAPI = () => {
    localStorage.removeItem("leonardo_api_key");
    localStorage.removeItem("leonardo_webhook_url");
    localStorage.removeItem("leonardo_api_issue");
    setLeonardoApiKey("");
    toast.success("Configurações da Leonardo AI resetadas.");
  };

  const handleToggleLeonardoAI = (checked: boolean) => {
    setUseLeonardoAI(checked);
    localStorage.setItem("use_leonardo_ai", checked.toString());
    toast.success(`Leonardo AI ${checked ? "ativado" : "desativado"} para geração de imagens.`);
  };

  const handleToggleOpenAI = (checked: boolean) => {
    setUseOpenAI(checked);
    localStorage.setItem("use_openai_for_images", checked.toString());
    toast.success(`OpenAI ${checked ? "ativado" : "desativado"} para geração de imagens de fallback.`);
  };

  const generateTestImage = async () => {
    try {
      setIsGeneratingTest(true);
      setTestImageUrl("");
      
      const prompt = "A children's book illustration of a cute bear in a forest, papercraft style";
      
      if (useLeonardoAI && leonardoApiKey) {
        try {
          // Import dynamically to avoid circular dependencies
          const { LeonardoAIAgent } = await import('@/services/LeonardoAIAgent');
          const agent = new LeonardoAIAgent();
          
          if (agent.isAgentAvailable()) {
            toast.info("Gerando imagem de teste com Leonardo AI...");
            
            const imageUrl = await agent.generateImage({
              prompt,
              characterName: "Bear",
              theme: "Forest",
              setting: "Woods",
              style: "papercraft"
            });
            
            if (imageUrl) {
              setTestImageUrl(imageUrl);
              toast.success("Imagem de teste gerada com sucesso usando Leonardo AI!");
              return;
            }
          }
        } catch (error) {
          console.error("Leonardo AI test image generation failed:", error);
          toast.error("Falha ao gerar imagem com Leonardo AI. Tentando com OpenAI...");
        }
      }
      
      if (useOpenAI) {
        toast.info("Gerando imagem de teste com OpenAI...");
        const imageUrl = await generateImageWithOpenAI(prompt);
        if (imageUrl) {
          setTestImageUrl(imageUrl);
          toast.success("Imagem de teste gerada com sucesso usando OpenAI!");
          return;
        }
      }
      
      toast.error("Não foi possível gerar a imagem de teste. Verifique as configurações da API.");
    } catch (error) {
      console.error("Error generating test image:", error);
      toast.error("Erro ao gerar imagem de teste.");
    } finally {
      setIsGeneratingTest(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Geração de Imagens</CardTitle>
        <CardDescription>
          Configure as APIs para geração de imagens das histórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leonardo" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leonardo">Leonardo AI</TabsTrigger>
            <TabsTrigger value="openai">OpenAI Fallback</TabsTrigger>
            <TabsTrigger value="test">Testar Geração</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leonardo">
            <div className="space-y-4">
              <LeonardoAIStatusCheck />
              
              <div className="space-y-2">
                <Label htmlFor="leonardo-api-key">Leonardo AI API Key</Label>
                <Input
                  id="leonardo-api-key"
                  type="password"
                  value={leonardoApiKey}
                  onChange={(e) => setLeonardoApiKey(e.target.value)}
                  placeholder="Insira sua chave API da Leonardo AI"
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="use-leonardo" 
                  checked={useLeonardoAI}
                  onCheckedChange={handleToggleLeonardoAI}
                />
                <Label htmlFor="use-leonardo">Utilizar Leonardo AI para geração de imagens</Label>
              </div>
              
              <div className="pt-4 space-x-4">
                <Button onClick={handleSaveLeonardoAPI}>
                  Salvar Chave API
                </Button>
                <Button variant="outline" onClick={handleResetLeonardoAPI}>
                  Resetar
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="openai">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuração de Fallback</AlertTitle>
                <AlertDescription>
                  O OpenAI será utilizado como fallback caso a Leonardo AI falhe ou não esteja disponível.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="use-openai" 
                  checked={useOpenAI}
                  onCheckedChange={handleToggleOpenAI}
                />
                <Label htmlFor="use-openai">Utilizar OpenAI como fallback para geração de imagens</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test">
            <div className="space-y-4">
              <Button 
                onClick={generateTestImage} 
                disabled={isGeneratingTest || (!useLeonardoAI && !useOpenAI)}>
                {isGeneratingTest ? "Gerando..." : "Gerar Imagem de Teste"}
              </Button>
              
              {testImageUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-sm text-gray-500">Imagem gerada:</p>
                  <img 
                    src={testImageUrl} 
                    alt="Test generated image" 
                    className="rounded-md border border-gray-200 max-w-full h-auto max-h-[400px] object-contain" 
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">
          A prioridade de geração é: Leonardo AI → OpenAI (se configurado como fallback)
        </p>
      </CardFooter>
    </Card>
  );
};

export default ImageGenerationManager;
