
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { LeonardoAIAgent } from "@/services/LeonardoAIAgent";

const LeonardoAIStatusCheck = () => {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const leonardoAgent = new LeonardoAIAgent();

  useEffect(() => {
    checkLeonardoAvailability();
  }, []);

  const checkLeonardoAvailability = async () => {
    try {
      setIsChecking(true);
      const apiKey = localStorage.getItem("leonardo_api_key");

      if (!apiKey) {
        setIsAvailable(false);
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

  return (
    <div className="my-4">
      {isAvailable !== null && (
        <Alert variant={isAvailable ? "default" : "destructive"} className="mb-4">
          {isAvailable ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {isAvailable
              ? "Leonardo AI Configurado"
              : "Leonardo AI Não Configurado"}
          </AlertTitle>
          <AlertDescription>
            {isAvailable
              ? "A API da Leonardo AI está configurada corretamente."
              : "A API da Leonardo AI não está configurada ou está com problemas."}
          </AlertDescription>
        </Alert>
      )}

      <Button 
        variant="outline" 
        onClick={checkLeonardoAvailability} 
        disabled={isChecking}
        className="mt-2"
      >
        {isChecking ? "Verificando..." : "Verificar Conexão com Leonardo AI"}
      </Button>
    </div>
  );
};

export default LeonardoAIStatusCheck;
