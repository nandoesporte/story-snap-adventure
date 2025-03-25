
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Info } from "lucide-react";
import { useStoryBot } from "@/hooks/useStoryBot";
import { toast } from "sonner";

const LeonardoWebhookConfig = () => {
  const { leonardoApiAvailable, resetLeonardoApiStatus } = useStoryBot();
  
  const handleReset = () => {
    resetLeonardoApiStatus();
    toast.success("Status da API de geração de imagens redefinido com sucesso");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Configuração de Geração de Imagens
        </CardTitle>
        <CardDescription>
          Informações sobre o sistema de geração de imagens para as histórias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Sistema de geração de imagens ativo</p>
            <p className="text-sm text-green-700">
              O StoryBot agora usa o modelo Gemini diretamente para gerar ilustrações para suas histórias.
              Não é mais necessário configurar um webhook do Leonardo AI.
            </p>
          </div>
        </div>
        
        {!leonardoApiAvailable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">API de geração de imagens indisponível</p>
              <p className="text-sm text-amber-700">
                A API de geração de imagens está marcada como indisponível. Você pode redefinir o status para tentar novamente.
              </p>
            </div>
          </div>
        )}
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
