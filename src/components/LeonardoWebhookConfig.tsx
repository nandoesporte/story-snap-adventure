
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useStoryBot } from "@/hooks/useStoryBot";

const LeonardoWebhookConfig = () => {
  const { leonardoApiAvailable, setLeonardoWebhook, leonardoWebhookUrl, resetLeonardoApiStatus } = useStoryBot();
  const [webhookUrl, setWebhookUrl] = useState(leonardoWebhookUrl || '');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeonardoWebhook(webhookUrl);
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Configuração do Leonardo AI
        </CardTitle>
        <CardDescription>
          Configure a URL do webhook para geração de imagens com Leonardo AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!leonardoApiAvailable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">API do Leonardo indisponível</p>
              <p className="text-sm text-amber-700">
                A API do Leonardo AI está marcada como indisponível. Configure um webhook ou redefina o status.
              </p>
            </div>
          </div>
        )}
        
        {leonardoWebhookUrl && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Webhook configurado</p>
              <p className="text-sm text-green-700">
                O webhook do Leonardo AI está configurado para: {leonardoWebhookUrl}
              </p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="webhook-url" className="text-sm font-medium">
              URL do Webhook do Leonardo AI
            </label>
            <Input
              id="webhook-url"
              placeholder="https://seu-webhook-leonardo-ai.com/api/generate"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Insira a URL completa do seu webhook que se conecta ao Leonardo AI para gerar imagens.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline"
          onClick={resetLeonardoApiStatus}
          disabled={leonardoApiAvailable}
        >
          Redefinir Status da API
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!webhookUrl}
        >
          Salvar Configuração
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeonardoWebhookConfig;
