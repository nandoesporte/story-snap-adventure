
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ExternalLink, Code, FileText } from "lucide-react";
import { getStorageAccessHelp } from "@/lib/storageBucketSetup";

interface StorageConfigAlertProps {
  className?: string;
  compact?: boolean;
}

const StorageConfigAlert = ({ className, compact = false }: StorageConfigAlertProps) => {
  const openSupabaseDashboard = () => {
    window.open("https://supabase.com/dashboard", "_blank");
  };
  
  const openDocumentation = () => {
    window.open("https://supabase.com/docs/guides/storage/security/access-control", "_blank");
  };

  if (compact) {
    return (
      <Alert className={className}>
        <AlertTitle className="flex items-center">
          <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
          Configuração de Armazenamento
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Políticas RLS configuradas para o bucket "story_images". Acesso público para visualização e upload para usuários autenticados.</p>
          <div className="flex gap-2 items-center justify-start">
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 font-medium underline"
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
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center text-blue-700">
          <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
          Configuração de Armazenamento Concluída
        </CardTitle>
        <CardDescription className="text-blue-600">
          As políticas RLS para o bucket "story_images" foram configuradas com sucesso. Se você encontrar problemas de acesso, verifique as configurações abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-blue-700">
        <ol className="list-decimal pl-5 space-y-2 mb-4">
          <li>O bucket "story_images" está configurado como "Public"</li>
          <li>Políticas RLS apropriadas foram aplicadas para leitura pública</li>
          <li>Usuários autenticados podem fazer upload de imagens</li>
          <li>Usuários autenticados podem gerenciar seus próprios objetos</li>
          <li>Se encontrar problemas, verifique as permissões do usuário atual</li>
        </ol>
        
        <div className="bg-blue-100 p-3 rounded-md border border-blue-300 flex items-start mt-2">
          <ShieldCheck className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Políticas RLS configuradas:</p>
            <p className="text-sm text-blue-700 mt-1 mb-3">
              O bucket "story_images" tem as seguintes políticas:
            </p>
            
            <div className="bg-white/80 p-2 rounded border border-blue-200 font-mono text-xs text-blue-900 mb-2 overflow-x-auto">
              <Code className="inline h-3 w-3 mr-1" />
              <span>CREATE POLICY "Allow public reading of story images"</span><br />
              <span className="ml-4">ON storage.objects</span><br />
              <span className="ml-4">FOR SELECT</span><br />
              <span className="ml-4">USING (bucket_id = 'story_images');</span>
            </div>
            
            <div className="bg-white/80 p-2 rounded border border-blue-200 font-mono text-xs text-blue-900 overflow-x-auto">
              <Code className="inline h-3 w-3 mr-1" />
              <span>CREATE POLICY "Allow authenticated uploads to story images"</span><br />
              <span className="ml-4">ON storage.objects</span><br />
              <span className="ml-4">FOR INSERT</span><br />
              <span className="ml-4">TO authenticated</span><br />
              <span className="ml-4">WITH CHECK (bucket_id = 'story_images');</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button 
          variant="default" 
          onClick={openSupabaseDashboard}
        >
          Acessar Painel Supabase <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
        
        <Button 
          variant="outline" 
          className="border-blue-300 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
          onClick={openDocumentation}
        >
          Documentação de RLS <FileText className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StorageConfigAlert;
