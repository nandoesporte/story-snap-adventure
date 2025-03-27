
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Info, Key } from "lucide-react";
import { useStoryBot } from "@/hooks/useStoryBot";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const LeonardoWebhookConfig = () => {
  const { 
    leonardoApiAvailable, 
    resetLeonardoApiStatus, 
    setLeonardoApiKey, 
    useOpenAIForStories,
    setUseOpenAIForStories
  } = useStoryBot();
  
  const [apiKey, setApiKey] = useState("");
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGPT4, setUseGPT4] = useState(true);
  
  useEffect(() => {
    // Verificar se o uso do OpenAI está ativado
    const storedValue = localStorage.getItem("use_openai_for_stories");
    setUseGPT4(storedValue === "true" || storedValue === null); // Padrão é verdadeiro
    
    // Carregar chave da API OpenAI se existir
    const savedOpenAiKey = localStorage.getItem("openai_api_key");
    if (savedOpenAiKey) {
      setOpenAiApiKey(savedOpenAiKey);
    }
  }, []);
  
  const handleReset = () => {
    resetLeonardoApiStatus();
    toast.success("Status da API de geração de imagens redefinido com sucesso");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  const handleSubmitKey = () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira uma chave de API válida");
      return;
    }
    
    setIsSubmitting(true);
    
    // Salvar a chave da API
    const success = setLeonardoApiKey(apiKey.trim());
    
    if (success) {
      toast.success("Chave da API Leonardo.ai configurada com sucesso!");
      setApiKey("");
      
      // Recarregar a página para aplicar as alterações
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast.error("Erro ao configurar a chave da API Leonardo.ai");
    }
    
    setIsSubmitting(false);
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
      localStorage.setItem("use_openai_for_stories", "true");
      
      toast.success("Chave da API OpenAI configurada com sucesso!");
      
      // Ativar o uso do GPT-4
      setUseGPT4(true);
      if (setUseOpenAIForStories) {
        setUseOpenAIForStories(true);
      }
      
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
      setUseOpenAIForStories(newValue);
      localStorage.setItem("use_openai_for_stories", newValue.toString());
      toast.success(newValue 
        ? "GPT-4 será usado para gerar histórias" 
        : "Gemini será usado para gerar histórias");
    }
  };
  
  const isOpenAIConfigured = !!localStorage.getItem("openai_api_key");
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Configuração das APIs
        </CardTitle>
        <CardDescription>
          Configure as chaves de API para gerar histórias e ilustrações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8 border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium mb-3">API OpenAI GPT-4</h3>
          
          {isOpenAIConfigured ? (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">API OpenAI configurada</p>
                <p className="text-sm text-green-700">
                  A API do OpenAI está configurada e pronta para gerar histórias com GPT-4 e ilustrações com DALL-E.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">API OpenAI não configurada</p>
                <p className="text-sm text-amber-700">
                  Configure sua chave de API do OpenAI para gerar histórias com GPT-4 e ilustrações com DALL-E.
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
                Salvar
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sua chave da API é armazenada localmente apenas neste dispositivo.
            </p>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-gpt4" className="text-sm font-medium">Usar OpenAI GPT-4</Label>
                <p className="text-xs text-slate-500">
                  Ative para gerar histórias e ilustrações usando a API do OpenAI
                </p>
              </div>
              <Switch
                id="use-gpt4"
                checked={useGPT4}
                onCheckedChange={handleToggleGPT4}
                disabled={!isOpenAIConfigured}
              />
            </div>
            
            {useGPT4 && isOpenAIConfigured && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <CheckCircle className="h-3 w-3 inline-block mr-1" />
                  O GPT-4 da OpenAI está ativado para geração de histórias e ilustrações.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-2">
          <h3 className="text-lg font-medium mb-3">API Leonardo.ai (Legado)</h3>
          
          {leonardoApiAvailable ? (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-start gap-2">
              <Info className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">API Leonardo.ai configurada (Legado)</p>
                <p className="text-sm text-gray-700">
                  A API do Leonardo.ai está configurada, mas recomendamos usar o OpenAI DALL-E para melhor compatibilidade.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-start gap-2">
              <Info className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">API Legada</p>
                <p className="text-sm text-gray-700">
                  O Leonardo.ai não é mais recomendado. Use a API OpenAI para gerar histórias e ilustrações.
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
          disabled={!leonardoApiAvailable}
          className="text-sm"
        >
          Redefinir Status da API
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeonardoWebhookConfig;
