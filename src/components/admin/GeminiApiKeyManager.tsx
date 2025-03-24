
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BookGenerationService } from '@/services/BookGenerationService';
import { reinitializeGeminiAI } from '@/lib/openai';

const GeminiApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load API key from localStorage on component mount
    const savedKey = BookGenerationService.getGeminiApiKey() || "";
    setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira uma chave de API válida");
      return;
    }

    setIsSaving(true);
    try {
      // Save API key to localStorage
      localStorage.setItem('gemini_api_key', apiKey);
      
      // Reinitialize Gemini with the new API key
      const newClient = reinitializeGeminiAI(apiKey);
      
      if (newClient) {
        toast.success("Chave da API Gemini salva com sucesso");
        
        // Test the connection
        setTestStatus('testing');
        try {
          // Make a simple test request to verify the API key works
          const model = newClient.getGenerativeModel({ model: "gemini-1.0-pro" });
          await model.generateContent("Test connection to Gemini API");
          setTestStatus('success');
          toast.success("Conexão com a API Gemini testada com sucesso!");
        } catch (error) {
          console.error("Error testing Gemini API:", error);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
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
            <p className="text-xs text-red-600 mt-2">
              ✗ Erro ao testar a conexão com a API Gemini
            </p>
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
  );
};

export default GeminiApiKeyManager;
