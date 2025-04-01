import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Wand2, RefreshCw, Save, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ImageGenerationManager = () => {
  const [leonardoApiKey, setLeonardoApiKey] = useState("");
  const [useLeonardo, setUseLeonardo] = useState(false);
  const [useOpenAI, setUseOpenAI] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [modelId, setModelId] = useState("e316348f-7773-490e-adcd-46757c738eb7"); // Default Leonardo model
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load Leonardo settings
      const savedLeonardoKey = localStorage.getItem("leonardo_api_key") || "";
      const savedUseLeonardo = localStorage.getItem("use_leonardo_ai") === "true";
      const savedModelId = localStorage.getItem("leonardo_model_id") || "e316348f-7773-490e-adcd-46757c738eb7";
      
      // Load OpenAI settings for image generation
      const savedUseOpenAI = localStorage.getItem("use_openai_for_images") !== "false";
      
      setLeonardoApiKey(savedLeonardoKey);
      setUseLeonardo(savedUseLeonardo);
      setUseOpenAI(savedUseOpenAI);
      setModelId(savedModelId);
      
      // Check if the Leonardo API key is valid
      if (savedLeonardoKey) {
        setConnectionStatus(localStorage.getItem("leonardo_api_issue") === "true" ? "error" : "idle");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Erro ao carregar as configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Save Leonardo settings
      if (leonardoApiKey) {
        localStorage.setItem("leonardo_api_key", leonardoApiKey);
        localStorage.setItem("leonardo_webhook_url", "https://cloud.leonardo.ai/api/rest/v1/generations");
      }
      
      localStorage.setItem("use_leonardo_ai", String(useLeonardo));
      localStorage.setItem("use_openai_for_images", String(useOpenAI));
      localStorage.setItem("leonardo_model_id", modelId);
      
      // Also save settings to system_configurations table if available
      try {
        // Save to Supabase system_configurations table
        const { data: leonardoKeyData, error: leonardoKeyError } = await supabase.functions.invoke(
          "create-system-configurations", 
          { body: { key: "leonardo_api_key", value: leonardoApiKey } }
        );
        
        const { data: useLeonardoData, error: useLeonardoError } = await supabase.functions.invoke(
          "create-system-configurations", 
          { body: { key: "use_leonardo_ai", value: String(useLeonardo) } }
        );
        
        const { data: useOpenAIData, error: useOpenAIError } = await supabase.functions.invoke(
          "create-system-configurations", 
          { body: { key: "use_openai_for_images", value: String(useOpenAI) } }
        );
        
        const { data: modelIdData, error: modelIdError } = await supabase.functions.invoke(
          "create-system-configurations", 
          { body: { key: "leonardo_model_id", value: modelId } }
        );
        
        if (leonardoKeyError || useLeonardoError || useOpenAIError || modelIdError) {
          console.error("Error saving to system_configurations:", { leonardoKeyError, useLeonardoError, useOpenAIError, modelIdError });
        }
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        // Continue even if saving to database fails
      }
      
      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar as configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const testLeonardoConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus("idle");
    
    try {
      if (!leonardoApiKey) {
        toast.error("Chave da API Leonardo não configurada");
        setConnectionStatus("error");
        return;
      }
      
      // Changed to use POST for user information endpoint which accepts POST
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${leonardoApiKey}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Leonardo API error:", errorText);
        toast.error("Falha ao conectar com a API Leonardo: " + response.statusText);
        setConnectionStatus("error");
        localStorage.setItem("leonardo_api_issue", "true");
        return;
      }
      
      const data = await response.json();
      if (data && data.user_details) {
        toast.success("Conexão com Leonardo AI estabelecida com sucesso");
        setConnectionStatus("success");
        localStorage.removeItem("leonardo_api_issue");
        
        // Update the model ID if not already set
        if (!modelId) {
          // Try to find the FLUX model or use default
          setModelId("e316348f-7773-490e-adcd-46757c738eb7");
          localStorage.setItem("leonardo_model_id", "e316348f-7773-490e-adcd-46757c738eb7");
        }
      } else {
        toast.error("Resposta inesperada da API Leonardo");
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Error testing Leonardo connection:", error);
      toast.error("Erro ao testar conexão: " + (error.message || "Erro desconhecido"));
      setConnectionStatus("error");
      localStorage.setItem("leonardo_api_issue", "true");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleToggleOpenAI = (checked: boolean) => {
    setUseOpenAI(checked);
    // If both are disabled, ensure at least one is enabled
    if (!checked && !useLeonardo) {
      setUseLeonardo(true);
    }
  };

  const handleToggleLeonardo = (checked: boolean) => {
    setUseLeonardo(checked);
    // If both are disabled, ensure at least one is enabled
    if (!checked && !useOpenAI) {
      setUseOpenAI(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Configuração do Motor de Geração de Imagens</h3>
        <p className="text-sm text-yellow-700">
          Configure quais APIs serão usadas para gerar as ilustrações das histórias infantis.
          Você pode escolher entre OpenAI DALL-E e Leonardo AI.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-medium">OpenAI DALL-E</h3>
            <p className="text-sm text-gray-500">Geração de imagens usando OpenAI DALL-E</p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="use-openai" checked={useOpenAI} onCheckedChange={handleToggleOpenAI} />
            <Badge variant={useOpenAI ? "success" : "outline"}>
              {useOpenAI ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>

        <Card className="p-4">
          <h3 className="font-medium mb-4">Leonardo AI</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ativar geração de imagens usando Leonardo AI</p>
                {connectionStatus === "success" && (
                  <span className="inline-flex items-center text-xs text-green-600 mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" /> Conectado
                  </span>
                )}
                {connectionStatus === "error" && (
                  <span className="inline-flex items-center text-xs text-red-600 mt-1">
                    <XCircle className="h-3 w-3 mr-1" /> Erro de conexão
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="use-leonardo" checked={useLeonardo} onCheckedChange={handleToggleLeonardo} />
                <Badge variant={useLeonardo ? "success" : "outline"}>
                  {useLeonardo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="leonardo-api-key">Chave da API Leonardo</Label>
              <Input
                id="leonardo-api-key"
                type="password"
                placeholder="api-key"
                value={leonardoApiKey}
                onChange={(e) => setLeonardoApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Obtenha sua chave em{" "}
                <a 
                  href="https://leonardo.ai/settings/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  leonardo.ai/settings/api-keys
                </a>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model-id">ID do Modelo Leonardo</Label>
              <Input
                id="model-id"
                placeholder="ID do modelo"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                O ID do modelo padrão é para o FLUX.1
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={testLeonardoConnection} 
                disabled={!leonardoApiKey || testingConnection || isLoading}
              >
                {testingConnection ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Testar Conexão
              </Button>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationManager;
