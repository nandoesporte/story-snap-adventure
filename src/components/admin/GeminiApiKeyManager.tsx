
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookGenerationService } from '@/services/BookGenerationService';
import { reinitializeGeminiAI } from '@/lib/openai';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GeminiApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || "";
    setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira uma chave de API válida");
      return;
    }

    setIsSaving(true);
    try {
      const trimmedKey = apiKey.trim();
      
      localStorage.setItem('gemini_api_key', trimmedKey);
      
      const newClient = reinitializeGeminiAI(trimmedKey);
      
      if (newClient) {
        toast.success("Chave da API Gemini salva com sucesso");
        
        setTestStatus('testing');
        try {
          const model = newClient.getGenerativeModel({ model: "gemini-1.5-pro" });
          const result = await model.generateContent("Test connection to Gemini API");
          
          const responseText = result.response.text();
          setDebugInfo(JSON.stringify({
            apiKeyLength: trimmedKey.length,
            apiKeyPrefix: trimmedKey.substring(0, 5) + "...",
            response: responseText,
            modelName: "gemini-1.5-pro",
            timestamp: new Date().toISOString()
          }, null, 2));
          
          console.log("API test successful:", responseText);
          
          setTestStatus('success');
          toast.success("Conexão com a API Gemini testada com sucesso!");
          
          localStorage.removeItem("storybot_api_issue");
        } catch (error) {
          console.error("Error testing Gemini API:", error);
          
          setDebugInfo(JSON.stringify({
            apiKeyLength: trimmedKey.length,
            apiKeyPrefix: trimmedKey.substring(0, 5) + "...",
            error: error.toString(),
            errorDetails: error.message || "No details available",
            modelName: "gemini-1.5-pro",
            timestamp: new Date().toISOString()
          }, null, 2));
          
          setTestStatus('error');
          toast.error("A chave foi salva, mas não foi possível testar a conexão. Verifique se a chave é válida.");
        }
      } else {
        toast.error("Erro ao inicializar o cliente Gemini. Verifique a chave da API.");
        setTestStatus('error');
      }
    } catch (error) {
      console.error("Error saving Gemini API key:", error);
      toast.error("Erro ao salvar a chave da API");
      setTestStatus('error');
      
      setDebugInfo(JSON.stringify({
        error: error.toString(),
        errorDetails: error.message || "No details available",
        timestamp: new Date().toISOString()
      }, null, 2));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuração da API do Gemini</CardTitle>
          <CardDescription>
            Configure sua chave da API do Gemini para geração de histórias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="apiKey">
              Chave da API Gemini
            </label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Obtenha sua chave da API em{" "}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
            
            {testStatus === 'success' && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Conexão com a API Gemini estabelecida com sucesso
              </p>
            )}
            
            {testStatus === 'error' && (
              <div className="mt-2">
                <p className="text-xs text-red-600">
                  ✗ Erro ao testar a conexão com a API Gemini
                </p>
                <button 
                  onClick={() => setShowDebugDialog(true)}
                  className="text-xs text-violet-600 hover:underline mt-1"
                >
                  Ver detalhes do erro
                </button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveApiKey} 
            disabled={isSaving || testStatus === 'testing'}
            className="w-full"
          >
            {isSaving || testStatus === 'testing' ? "Salvando e testando..." : "Salvar e Testar Chave da API"}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Informações de Depuração</DialogTitle>
            <DialogDescription>
              Use estas informações para ajudar a solucionar problemas com a chave da API
            </DialogDescription>
          </DialogHeader>
          <div className="bg-black/10 p-4 rounded-md">
            <pre className="text-xs overflow-auto max-h-[300px]">
              {debugInfo}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDebugDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeminiApiKeyManager;
