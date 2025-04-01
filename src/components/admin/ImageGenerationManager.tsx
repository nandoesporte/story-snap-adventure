import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { generateImageWithOpenAI } from "@/lib/openai";
import LeonardoAIStatusCheck from "./LeonardoAIStatusCheck";
import { LeonardoAIAgent } from "@/services/LeonardoAIAgent";

const ImageGenerationManager = () => {
  const [useOpenAI, setUseOpenAI] = useState<boolean>(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [testImageUrl, setTestImageUrl] = useState<string>("");
  const [testError, setTestError] = useState<string>("");
  const [useLeonardo, setUseLeonardo] = useState<boolean>(true);
  const leonardoAgent = new LeonardoAIAgent();

  useEffect(() => {
    // Load saved preferences
    const savedUseOpenAI = localStorage.getItem("use_openai_for_images") === "true";
    const savedUseLeonardo = localStorage.getItem("use_leonardo_ai") !== "false";
    
    setUseOpenAI(savedUseOpenAI);
    setUseLeonardo(savedUseLeonardo);
  }, []);

  const handleToggleOpenAI = (checked: boolean) => {
    setUseOpenAI(checked);
    localStorage.setItem("use_openai_for_images", checked.toString());
    toast.success(`OpenAI ${checked ? "ativado" : "desativado"} para geração de imagens de fallback.`);
  };

  const handleToggleLeonardo = (checked: boolean) => {
    setUseLeonardo(checked);
    localStorage.setItem("use_leonardo_ai", checked.toString());
    toast.success(`Leonardo AI ${checked ? "ativado" : "desativado"} para geração de imagens.`);
  };

  const generateTestImage = async () => {
    try {
      setIsGeneratingTest(true);
      setTestImageUrl("");
      setTestError("");
      
      const prompt = "A children's book illustration of a cute bear in a forest, papercraft style";
      
      // First check if Leonardo AI is available and configured
      const leonardoApiKey = localStorage.getItem("leonardo_api_key");
      
      if (useLeonardo && leonardoApiKey) {
        try {
          toast.info("Gerando imagem de teste com Leonardo AI...");
          console.log("Starting test image generation with Leonardo AI");
          
          const imageUrl = await leonardoAgent.generateImage({
            prompt,
            characterName: "Bear",
            theme: "Forest",
            setting: "Woods",
            style: "papercraft"
          });
          
          console.log("Leonardo AI test image result:", imageUrl ? "Success" : "Failed");
          
          if (imageUrl) {
            setTestImageUrl(imageUrl);
            toast.success("Imagem de teste gerada com sucesso usando Leonardo AI!");
            return;
          }
        } catch (error) {
          console.error("Leonardo AI test image generation failed:", error);
          toast.error("Falha ao gerar imagem com Leonardo AI. Tentando com OpenAI...");
        }
      } else {
        console.warn("Leonardo AI is not enabled or API key not available");
        toast.warning("O serviço Leonardo AI não está disponível. Verificando alternativas...");
      }
      
      // Try with OpenAI if Leonardo failed or is not available
      if (useOpenAI) {
        toast.info("Gerando imagem de teste com OpenAI...");
        try {
          console.log("Attempting to generate with OpenAI");
          const imageUrl = await generateImageWithOpenAI(prompt);
          if (imageUrl) {
            setTestImageUrl(imageUrl);
            toast.success("Imagem de teste gerada com sucesso usando OpenAI!");
            return;
          }
        } catch (openAiError) {
          console.error("OpenAI test image generation failed:", openAiError);
          setTestError(openAiError instanceof Error ? openAiError.message : "Erro desconhecido ao gerar com OpenAI");
          toast.error("Falha ao gerar imagem com OpenAI.");
        }
      }
      
      if (!testImageUrl) {
        setTestError("Nenhum serviço de geração de imagens disponível ou configurado corretamente.");
        toast.error("Não foi possível gerar a imagem de teste. Verifique as configurações da API.");
      }
    } catch (error) {
      console.error("Error generating test image:", error);
      setTestError(error instanceof Error ? error.message : "Erro desconhecido");
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
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="test">Testar Geração</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leonardo">
            <div className="space-y-4">
              <LeonardoAIStatusCheck />
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
          
          <TabsContent value="preferences">
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Preferências de Geração</AlertTitle>
                <AlertDescription>
                  Configure as preferências de geração de imagens
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="use-leonardo" 
                  checked={useLeonardo}
                  onCheckedChange={handleToggleLeonardo}
                />
                <Label htmlFor="use-leonardo">Utilizar Leonardo AI para geração de imagens</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test">
            <div className="space-y-4">
              <Button 
                onClick={generateTestImage} 
                disabled={isGeneratingTest}>
                {isGeneratingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : "Gerar Imagem de Teste"}
              </Button>
              
              {testError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro na geração</AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}
              
              {testImageUrl && (
                <div className="mt-4">
                  <Alert className="mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Sucesso!</AlertTitle>
                    <AlertDescription>Imagem gerada com sucesso</AlertDescription>
                  </Alert>
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
