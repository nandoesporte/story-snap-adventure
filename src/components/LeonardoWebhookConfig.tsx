
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
    leonardoWebhookUrl,
    updateLeonardoWebhookUrl,
    useOpenAIForStories,
    setUseOpenAIForStories
  } = useStoryBot();
  
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGPT4, setUseGPT4] = useState(false);
  
  useEffect(() => {
    if (leonardoWebhookUrl) {
      setWebhookUrl(leonardoWebhookUrl);
    }
    
    // Verificar se o uso do OpenAI está ativado
    const storedValue = localStorage.getItem("use_openai_for_stories");
    setUseGPT4(storedValue === "true");
  }, [leonardoWebhookUrl]);
  
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
  
  const handleSubmitWebhookUrl = () => {
    if (!webhookUrl.trim()) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }
    
    setIsSubmitting(true);
    
    // Salvar a URL do webhook
    if (updateLeonardoWebhookUrl) {
      const success = updateLeonardoWebhookUrl(webhookUrl.trim());
      
      if (success) {
        toast.success("URL do webhook Leonardo.ai configurada com sucesso!");
        
        // Recarregar a página para aplicar as alterações
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error("Erro ao configurar a URL do webhook Leonardo.ai");
      }
    } else {
      toast.error("Função de atualização do webhook não disponível");
    }
    
    setIsSubmitting(false);
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
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Configuração da API Leonardo.ai
        </CardTitle>
        <CardDescription>
          Configure a API do Leonardo.ai para gerar ilustrações personalizadas para as histórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leonardoApiAvailable ? (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">API Leonardo.ai configurada</p>
              <p className="text-sm text-green-700">
                A API do Leonardo.ai está configurada e pronta para gerar ilustrações para suas histórias.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">API Leonardo.ai não configurada</p>
              <p className="text-sm text-amber-700">
                Configure sua chave de API do Leonardo.ai para gerar ilustrações personalizadas para suas histórias.
                Obtenha uma chave em <a href="https://leonardo.ai" target="_blank" rel="noreferrer" className="text-amber-800 underline">leonardo.ai</a>
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4 space-y-6">
          <div>
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
                disabled={isSubmitting || !apiKey.trim()}
                size="sm"
              >
                Salvar
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sua chave da API é armazenada localmente apenas neste dispositivo.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-medium">URL do Webhook Leonardo.ai (opcional)</p>
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="URL do webhook (opcional)"
                className="flex-1"
              />
              <Button 
                onClick={handleSubmitWebhookUrl}
                disabled={isSubmitting || !webhookUrl.trim()}
                size="sm"
              >
                Salvar
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Somente é necessário se você tiver um servidor de webhook personalizado.
            </p>
          </div>
          
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-gpt4" className="text-sm font-medium">Usar OpenAI GPT-4</Label>
                <p className="text-xs text-slate-500">
                  Ative para gerar histórias usando o modelo GPT-4 da OpenAI ao invés do Gemini
                </p>
              </div>
              <Switch
                id="use-gpt4"
                checked={useGPT4}
                onCheckedChange={handleToggleGPT4}
              />
            </div>
            
            {useGPT4 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <AlertCircle className="h-3 w-3 inline-block mr-1" />
                  O GPT-4 da OpenAI está ativado para geração de histórias. As histórias serão geradas com mais detalhes e criatividade.
                </p>
              </div>
            )}
          </div>
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
