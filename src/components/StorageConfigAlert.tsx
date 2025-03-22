
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";

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
        <AlertDescription>
          Para que o upload de arquivos funcione corretamente, você precisa criar um bucket de armazenamento chamado 'public' no seu projeto Supabase.
          <Button 
            variant="link" 
            className="p-0 h-auto text-destructive font-medium underline ml-1"
            onClick={openSupabaseDashboard}
          >
            Acessar Supabase <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
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
          Para que o upload de arquivos funcione corretamente, você precisa criar um bucket de armazenamento chamado 'public' no seu projeto Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-red-700">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Acesse o painel do Supabase</li>
          <li>Navegue até Storage → Buckets</li>
          <li>Clique em "New Bucket"</li>
          <li>Nomeie o bucket como "public"</li>
          <li>Marque a opção "Public bucket" (para acesso público aos arquivos)</li>
          <li>Configure as RLS policies conforme necessário para controle de acesso</li>
        </ol>
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
