
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
      reinitializeGeminiAI(apiKey);
      
      toast.success("Chave da API Gemini salva com sucesso");
    } catch (error) {
      console.error("Error saving Gemini API key:", error);
      toast.error("Erro ao salvar a chave da API");
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
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveApiKey} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Salvar Chave da API"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GeminiApiKeyManager;
