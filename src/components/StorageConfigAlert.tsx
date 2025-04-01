
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, ShieldCheck, Code, FileText } from "lucide-react";
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
      <Alert variant="destructive" className={className}>
        <AlertTitle className="flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Configuração do Storage Necessária
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>O bucket de imagens existe no Supabase, mas você não tem permissões para acessá-lo.</p>
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
          O bucket 'story_images' existe no Supabase, mas sua aplicação não tem permissões para acessá-lo. Isso é provavelmente devido às configurações de RLS (Row Level Security).
        </CardDescription>
      </CardHeader>
      <CardContent className="text-red-700">
        <ol className="list-decimal pl-5 space-y-2 mb-4">
          <li>Acesse o painel do Supabase</li>
          <li>Navegue até Storage → Buckets</li>
          <li>Verifique se o bucket "story_images" está marcado como "Public"</li>
          <li>Vá para a aba "Policies" do bucket e adicione as políticas RLS necessárias</li>
          <li>Certifique-se que existe uma policy para permitir acesso público (SELECT) aos objetos</li>
        </ol>
        
        <div className="bg-red-100 p-3 rounded-md border border-red-300 flex items-start mt-2">
          <ShieldCheck className="h-5 w-5 mr-2 text-red-700 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Políticas RLS necessárias:</p>
            <p className="text-sm text-red-700 mt-1 mb-3">
              O bucket "story_images" deve ter pelo menos estas políticas:
            </p>
            
            <div className="bg-white/80 p-2 rounded border border-red-200 font-mono text-xs text-red-900 mb-2 overflow-x-auto">
              <Code className="inline h-3 w-3 mr-1" />
              <span>CREATE POLICY "Allow public reading of story images"</span><br />
              <span className="ml-4">ON storage.objects</span><br />
              <span className="ml-4">FOR SELECT</span><br />
              <span className="ml-4">USING (bucket_id = 'story_images');</span>
            </div>
            
            <div className="bg-white/80 p-2 rounded border border-red-200 font-mono text-xs text-red-900 overflow-x-auto">
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
          variant="destructive" 
          onClick={openSupabaseDashboard}
        >
          Acessar Painel Supabase <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
        
        <Button 
          variant="outline" 
          className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
          onClick={openDocumentation}
        >
          Documentação de RLS <FileText className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StorageConfigAlert;
