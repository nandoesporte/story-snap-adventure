
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Info, Key } from "lucide-react";
import { useStoryBot } from "@/hooks/useStoryBot";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const LeonardoWebhookConfig = () => {
  const { leonardoApiAvailable, resetLeonardoApiStatus, setLeonardoApiKey } = useStoryBot();
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button 
          variant="outline"
          onClick={handleReset}
          disabled={leonardoApiAvailable}
          className="text-sm"
        >
          Redefinir Status da API
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeonardoWebhookConfig;
