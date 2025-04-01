
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";

interface StorageConfigAlertProps {
  className?: string;
  compact?: boolean;
}

const StorageConfigAlert = ({ className, compact = false }: StorageConfigAlertProps) => {
  const openSupabaseDashboard = () => {
    window.open("https://supabase.com/dashboard", "_blank");
  };

  if (compact) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTitle className="flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Configuração do Storage Necessária
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Para que o upload de arquivos funcione corretamente, verifique as políticas RLS do bucket de armazenamento.</p>
          <div className="flex gap-2 items-center justify-start">
            <Button 
              variant="link" 
              className="p-0 h-auto text-destructive font-medium underline"
              onClick={openSupabaseDashboard}
            >
              Acessar Supabase <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center text-red-700">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Configuração do Storage Necessária
        </CardTitle>
        <CardDescription className="text-red-600">
          Para que as imagens funcionem corretamente, são necessárias configurações no bucket 'story_images' no seu projeto Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-red-700">
        <ol className="list-decimal pl-5 space-y-1 mb-3">
          <li>Acesse o painel do Supabase</li>
          <li>Navegue até Storage → Buckets</li>
          <li>Verifique se existe o bucket "story_images" e se está marcado como "Public"</li>
          <li>Verifique as RLS policies do bucket para garantir acesso público às imagens</li>
          <li>Certifique-se que existe uma policy de acesso público para SELECT</li>
        </ol>
        
        <div className="bg-red-100 p-3 rounded-md border border-red-300 flex items-start mt-2">
          <ShieldCheck className="h-5 w-5 mr-2 text-red-700 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Políticas RLS necessárias:</p>
            <p className="text-sm text-red-700 mt-1">
              O bucket "story_images" deve ter uma política que permita SELECT para usuários anônimos.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="destructive" 
          className="mt-2"
          onClick={openSupabaseDashboard}
        >
          Acessar Painel Supabase <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StorageConfigAlert;
