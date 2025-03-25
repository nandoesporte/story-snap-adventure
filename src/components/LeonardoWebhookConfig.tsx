
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info, HelpCircle } from "lucide-react";
import { useStoryBot } from "@/hooks/useStoryBot";
import { HelpPopover } from "@/components/ui/popover";
import { toast } from "sonner";

const LeonardoWebhookConfig = () => {
  const { leonardoApiAvailable, setLeonardoWebhook, leonardoWebhookUrl, resetLeonardoApiStatus } = useStoryBot();
  const [webhookUrl, setWebhookUrl] = useState(leonardoWebhookUrl || '');
  const [isTesting, setIsTesting] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }
    
    if (setLeonardoWebhook(webhookUrl)) {
      toast.success("Webhook configurado com sucesso!");
      // Recarregue apenas se necessário para aplicar mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };
  
  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error("Por favor, insira uma URL de webhook válida");
      return;
    }
    
    setIsTesting(true);
    try {
      toast.info("Testando conexão com o webhook...");
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "Test connection to Leonardo AI webhook",
          character_name: "TestCharacter",
          theme: "test",
          setting: "test setting",
          style: "cartoon"
        }),
      });
      
      if (!response.ok) {
        toast.error(`Erro ao conectar com o webhook: ${response.status} ${response.statusText}`);
        throw new Error(`Erro de resposta: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Resposta do webhook:", data);
      
      if (data.success || data.image_url) {
        toast.success("Conexão com webhook bem sucedida!");
        setLeonardoWebhook(webhookUrl);
      } else {
        toast.error("O webhook respondeu, mas não retornou um formato esperado. Verifique se a implementação está correta.");
      }
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast.error("Erro ao testar o webhook. Verifique se a URL está correta e o serviço está online.");
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleReset = () => {
    resetLeonardoApiStatus();
    toast.success("Status da API do Leonardo redefinido com sucesso");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
            <div className="flex items-center gap-2">
              <label htmlFor="webhook-url" className="text-sm font-medium">
                URL do Webhook do Leonardo AI
              </label>
              
              <HelpPopover 
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <HelpCircle className="h-4 w-4 text-gray-500" />
                  </Button>
                }
              >
                <div className="space-y-2">
                  <h4 className="font-medium">O que é um webhook do Leonardo AI?</h4>
                  <p className="text-sm text-gray-700">
                    O webhook é um serviço que você configura para conectar-se ao Leonardo AI e gerar ilustrações para suas histórias. Você precisa configurar um serviço externo que receba as requisições e chame a API do Leonardo AI.
                  </p>
                  <p className="text-sm text-gray-700">
                    Você pode criar um webhook simples usando serviços como AWS Lambda, Vercel Functions, ou Google Cloud Functions.
                  </p>
                  <p className="text-sm text-gray-700 font-medium mt-2">
                    Formato esperado de resposta do webhook:
                  </p>
                  <pre className="bg-gray-100 p-2 rounded text-xs">
                    {`{
  "image_url": "https://exemplo.com/imagem.jpg",
  "success": true
}`}
                  </pre>
                </div>
              </HelpPopover>
            </div>
            
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
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleReset}
            disabled={leonardoApiAvailable}
            className="text-sm"
          >
            Redefinir Status da API
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleTest}
            disabled={!webhookUrl || isTesting}
            className="text-sm"
          >
            {isTesting ? "Testando..." : "Testar Conexão"}
          </Button>
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={!webhookUrl}
          className="text-sm"
        >
          Salvar Configuração
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LeonardoWebhookConfig;
