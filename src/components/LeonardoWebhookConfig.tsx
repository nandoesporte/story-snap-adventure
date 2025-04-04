
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info, Key, Image, Zap, ZapOff } from "lucide-react";
import { useStoryBot } from "@/hooks/useStoryBot";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const LeonardoWebhookConfig = () => {
  const { 
    leonardoApiAvailable, 
    resetLeonardoApiStatus, 
    setLeonardoApiKey, 
    useOpenAIForStories,
    setUseOpenAIForStories,
    openAIModel,
    checkOpenAIAvailability
  } = useStoryBot();
  
  const [apiKey, setApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeonardoTesting, setIsLeonardoTesting] = useState(false);
  const [useGPT4, setUseGPT4] = useState(useOpenAIForStories);
  const [useLeonardo, setUseLeonardo] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>(openAIModel || 'gpt-4o-mini');
  
  useEffect(() => {
    // Verificar se o uso do OpenAI está ativado
    const storedValue = localStorage.getItem("use_openai_for_stories");
    setUseGPT4(storedValue === "true");
    
    // Verificar se o uso do Leonardo.AI está ativado
    const useLeonardoAI = localStorage.getItem("use_leonardo_ai");
    setUseLeonardo(useLeonardoAI !== "false"); // por padrão é true se não existir
    
    // Carregar chave da API OpenAI se existir
    const savedOpenAiKey = localStorage.getItem("openai_api_key");
    if (savedOpenAiKey) {
      setOpenAiApiKey(savedOpenAiKey);
    }
    
    // Carregar chave da API Leonardo se existir
    const savedLeonardoKey = localStorage.getItem("leonardo_api_key");
    if (savedLeonardoKey) {
      setApiKey(savedLeonardoKey);
    }
    
    // Carregar modelo selecionado
    const savedModel = localStorage.getItem("openai_model");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, [useOpenAIForStories, openAIModel]);
  
  const handleReset = () => {
    resetLeonardoApiStatus();
    toast.success("Status da API de geração de imagens redefinido com sucesso");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  const handleSubmitKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira uma chave de API válida");
      return;
    }
    
    setIsSubmitting(true);
    setIsLeonardoTesting(true);
    
    try {
      // Teste de conexão simples antes de salvar a chave
      const testResponse = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!testResponse.ok) {
        toast.error(`Erro ao testar a API Leonardo: ${testResponse.status}`);
        setIsSubmitting(false);
        setIsLeonardoTesting(false);
        return;
      }
      
      // Salvar a chave da API
      const success = setLeonardoApiKey(apiKey.trim());
      
      if (success) {
        toast.success("Chave da API Leonardo.ai configurada e testada com sucesso!");
        
        // Recarregar a página para aplicar as alterações
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Erro ao configurar a chave da API Leonardo.ai");
      }
    } catch (error) {
      console.error("Erro ao testar a chave da API Leonardo:", error);
      toast.error("Erro ao testar a conexão com a API Leonardo. Verifique a chave e tente novamente.");
    } finally {
      setIsSubmitting(false);
      setIsLeonardoTesting(false);
    }
  };
  
  const handleSubmitOpenAiKey = () => {
    if (!openAiApiKey.trim()) {
      toast.error("Por favor, insira uma chave de API OpenAI válida");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Salvar a chave da API OpenAI
      localStorage.setItem("openai_api_key", openAiApiKey.trim());
      
      toast.success("Chave da API OpenAI configurada com sucesso!");
      
      // Recarregar a página para aplicar as alterações
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Erro ao salvar chave OpenAI:", error);
      toast.error("Erro ao configurar a chave da API OpenAI");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleToggleGPT4 = () => {
    const newValue = !useGPT4;
    setUseGPT4(newValue);
    
    // Atualizar a configuração
    if (setUseOpenAIForStories) {
      setUseOpenAIForStories(newValue, selectedModel);
      localStorage.setItem("use_openai_for_stories", newValue.toString());
      toast.success(newValue 
        ? `${selectedModel} será usado para gerar histórias e ilustrações` 
        : "OpenAI não será usado para histórias");
    }
  };
  
  const handleToggleLeonardo = () => {
    const newValue = !useLeonardo;
    setUseLeonardo(newValue);
    
    // Salvar configuração no localStorage
    localStorage.setItem("use_leonardo_ai", newValue.toString());
    
    toast.success(newValue 
      ? "Leonardo.ai será usado como opção de geração de imagens" 
      : "Leonardo.ai está desativado");
    
    // Se o Leonardo for desativado e o OpenAI não estiver ativo, ativar o OpenAI
    if (!newValue && !useGPT4 && checkOpenAIAvailability()) {
      setUseGPT4(true);
      setUseOpenAIForStories(true, selectedModel);
      localStorage.setItem("use_openai_for_stories", "true");
      toast.info("OpenAI foi ativado automaticamente para geração de imagens");
    }
  };
  
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    
    // Atualizar a configuração se OpenAI estiver ativado
    if (useGPT4 && setUseOpenAIForStories) {
      setUseOpenAIForStories(true, value);
      localStorage.setItem("openai_model", value);
      toast.success(`Modelo alterado para ${value}`);
    }
  };
  
  const isOpenAIConfigured = checkOpenAIAvailability();
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Configuração das APIs
        </CardTitle>
        <CardDescription>
          Ative ou desative as APIs para gerar histórias e ilustrações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Image className="h-5 w-5 text-emerald-500" />
            API OpenAI DALL-E e GPT
          </h3>
          
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-0.5">
              <Label htmlFor="use-gpt4" className="text-base font-medium flex items-center">
                <Zap className={`h-4 w-4 mr-2 ${useGPT4 ? 'text-green-500' : 'text-gray-400'}`} />
                Ativar OpenAI
              </Label>
              <p className="text-sm text-slate-500">
                Usar OpenAI para gerar histórias e ilustrações
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={useGPT4 ? "secondary" : "outline"} 
                className={useGPT4 ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : "text-gray-500"}
              >
                {useGPT4 ? "Ativado" : "Desativado"}
              </Badge>
              <Switch
                id="use-gpt4"
                checked={useGPT4}
                onCheckedChange={handleToggleGPT4}
                disabled={!isOpenAIConfigured}
              />
            </div>
          </div>
          
          {isOpenAIConfigured ? (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">API OpenAI configurada</p>
                <p className="text-sm text-green-700">
                  A API do OpenAI está configurada e pronta para gerar histórias com GPT e ilustrações com DALL-E.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">API OpenAI não configurada</p>
                <p className="text-sm text-amber-700">
                  Configure sua chave de API do OpenAI para gerar histórias com GPT e ilustrações com DALL-E.
                  Obtenha uma chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-amber-800 underline">platform.openai.com</a>
                </p>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-medium">Chave da API OpenAI</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                value={openAiApiKey}
                onChange={(e) => setOpenAiApiKey(e.target.value)}
                placeholder="Cole sua chave de API do OpenAI"
                className="flex-1"
              />
              <Button 
                onClick={handleSubmitOpenAiKey}
                disabled={isSubmitting || !openAiApiKey.trim()}
                size="sm"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sua chave da API é armazenada localmente apenas neste dispositivo.
            </p>
          </div>
          
          {useGPT4 && isOpenAIConfigured && (
            <div className="mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="model-select">Modelo OpenAI</Label>
                <Select 
                  value={selectedModel} 
                  onValueChange={handleModelChange}
                  disabled={!isOpenAIConfigured || !useGPT4}
                >
                  <SelectTrigger id="model-select">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Mais poderoso)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Mais rápido, mais barato)</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais econômico)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Selecione o modelo OpenAI que deseja usar para gerar histórias e descrições de imagens.
                </p>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <CheckCircle className="h-4 w-4 inline-block mr-1 text-blue-500" />
                  O OpenAI DALL-E está ativado para geração de ilustrações consistentes.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-6" />
        
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Image className="h-5 w-5 text-violet-500" />
                API Leonardo.ai
              </h3>
              <p className="text-sm text-slate-500">
                Geração alternativa de ilustrações
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={useLeonardo ? "secondary" : "outline"} 
                className={useLeonardo ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" : "text-gray-500"}
              >
                {useLeonardo ? "Ativado" : "Desativado"}
              </Badge>
              <Switch
                id="use-leonardo"
                checked={useLeonardo}
                onCheckedChange={handleToggleLeonardo}
              />
            </div>
          </div>
          
          {useLeonardo ? (
            <>
              {leonardoApiAvailable ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">API Leonardo.ai configurada</p>
                    <p className="text-sm text-green-700">
                      A API do Leonardo.ai está configurada e será usada como opção para geração de ilustrações quando o OpenAI não for utilizado.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">API Leonardo.ai não configurada</p>
                    <p className="text-sm text-amber-700">
                      Configure sua chave de API do Leonardo.ai para a geração alternativa de ilustrações.
                      Obtenha uma chave em <a href="https://app.leonardo.ai/api-key" target="_blank" rel="noreferrer" className="text-amber-800 underline">app.leonardo.ai</a>
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-medium">Chave da API Leonardo.ai</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua chave de API do Leonardo.ai"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSubmitKey}
                    disabled={isSubmitting || !apiKey.trim() || isLeonardoTesting}
                    size="sm"
                  >
                    {isLeonardoTesting ? "Testando..." : (isSubmitting ? "Salvando..." : "Salvar")}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sua chave da API é armazenada localmente apenas neste dispositivo.
                </p>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-md bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2">
                <ZapOff className="h-5 w-5 text-gray-500" />
                <p className="text-sm text-gray-700">
                  API Leonardo.ai está desativada. Ative para usar como alternativa de geração de imagens.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button 
          variant="outline"
          onClick={handleReset}
          className="text-sm"
        >
          Redefinir Status das APIs
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeonardoWebhookConfig;
