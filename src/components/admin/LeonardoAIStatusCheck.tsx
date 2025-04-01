
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { LeonardoAIAgent } from "@/services/LeonardoAIAgent";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LeonardoAIStatusCheck = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const leonardoAgent = new LeonardoAIAgent();

  useEffect(() => {
    const savedKey = localStorage.getItem("leonardo_api_key") || "";
    setApiKey(savedKey);
    
    if (savedKey) {
      checkLeonardoAvailability();
    } else {
      setIsAvailable(false);
    }
  }, []);

  const checkLeonardoAvailability = async () => {
    try {
      setIsChecking(true);
      const apiKey = localStorage.getItem("leonardo_api_key");

      if (!apiKey) {
        setIsAvailable(false);
        toast.error("Chave da API Leonardo não encontrada. Configure-a nas configurações.");
        return;
      }

      const available = leonardoAgent.isAgentAvailable();
      const testResult = await leonardoAgent.testConnection();
      
      console.log("Leonardo API status check:", {available, testResult});
      setIsAvailable(available && testResult);
      
      if (available && testResult) {
        toast.success("Conexão com Leonardo AI estabelecida com sucesso!");
      } else {
        toast.error("Não foi possível conectar ao serviço Leonardo AI. Verifique sua chave API.");
      }
    } catch (error) {
      console.error("Error checking Leonardo availability:", error);
      setIsAvailable(false);
      toast.error("Erro ao verificar disponibilidade da Leonardo AI");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey || apiKey.trim().length < 10) {
      toast.error("Por favor, insira uma chave API válida");
      return;
    }

    setIsSaving(true);
    try {
      const success = leonardoAgent.setApiKey(apiKey.trim());
      if (success) {
        localStorage.setItem("leonardo_api_key", apiKey.trim());
        toast.success("Chave API Leonardo AI salva com sucesso");
        await checkLeonardoAvailability();
      } else {
        toast.error("Falha ao salvar a chave API");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("Erro ao salvar chave API");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("leonardo_api_key");
    localStorage.removeItem("leonardo_api_issue");
    setApiKey("");
    setIsAvailable(false);
    toast.success("Configurações da Leonardo AI resetadas");
  };

  return (
    <div className="space-y-6">
      <Alert variant={isAvailable === null ? "default" : isAvailable ? "default" : "destructive"} className="mb-4">
        {isAvailable === null ? (
          <AlertCircle className="h-4 w-4" />
        ) : isAvailable ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>
          {isAvailable === null ? (
            "Verificando status..."
          ) : isAvailable ? (
            "Leonardo AI Configurado"
          ) : (
            "Leonardo AI Não Configurado"
          )}
        </AlertTitle>
        <AlertDescription>
          {isAvailable === null ? (
            <Skeleton className="h-4 w-full" />
          ) : isAvailable ? (
            "A API da Leonardo AI está configurada corretamente e pronta para uso."
          ) : (
            "A API da Leonardo AI não está configurada ou está com problemas. Configure a chave API abaixo."
          )}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="leonardo-api-key">Leonardo AI API Key</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="leonardo-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Insira sua chave API da Leonardo AI"
              className="flex-1"
            />
            <Button 
              onClick={handleSaveKey} 
              disabled={isSaving || !apiKey.trim()}
              className="whitespace-nowrap"
            >
              {isSaving ? "Salvando..." : "Salvar Chave"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Obtenha sua chave API em{" "}
            <a 
              href="https://app.leonardo.ai/api-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              app.leonardo.ai/api-key <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            onClick={checkLeonardoAvailability} 
            disabled={isChecking}
          >
            {isChecking ? "Verificando..." : "Verificar Conexão"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="text-destructive hover:text-destructive"
          >
            Resetar Configurações
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4 mt-4">
        <h3 className="text-sm font-medium mb-2">Dicas para usar a Leonardo AI</h3>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Certifique-se de ter uma conta válida na Leonardo AI</li>
          <li>A API tem limites diários de requisições</li>
          <li>As imagens geradas são armazenadas temporariamente</li>
          <li>Recomendamos configurar também o OpenAI como fallback</li>
        </ul>
      </div>
    </div>
  );
};

export default LeonardoAIStatusCheck;
