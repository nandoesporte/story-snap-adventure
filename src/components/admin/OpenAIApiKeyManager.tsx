
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCw, Check, X, InfoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const OpenAIApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    // Load the API key from localStorage when component initializes
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API válida');
      return;
    }

    localStorage.setItem('openai_api_key', apiKey.trim());
    toast.success('Chave da API OpenAI salva com sucesso');
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API para testar');
      return;
    }

    setIsLoading(true);
    setTestStatus('testing');

    try {
      // Call OpenAI API to test the key
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello, this is a test.' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta da API OpenAI:', errorData);
        throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
      }

      // Test was successful
      setTestStatus('success');
      toast.success('Teste realizado com sucesso. A chave da API OpenAI está funcionando.');
      
      // Automatically save the key if the test is successful
      localStorage.setItem('openai_api_key', apiKey.trim());
      
    } catch (error) {
      console.error('Erro ao testar a API OpenAI:', error);
      setTestStatus('failed');
      toast.error(`Falha no teste da API: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setTestStatus('idle');
    toast.info('Chave da API OpenAI removida');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da API OpenAI</CardTitle>
        <CardDescription>
          Configure sua chave de API para acessar os modelos da OpenAI para geração de histórias e imagens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              id="openaiApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua chave da API OpenAI"
              className="font-mono"
            />
            {testStatus === 'success' && (
              <div className="text-sm text-green-600 flex items-center mt-1">
                <Check className="h-4 w-4 mr-1" /> 
                API está funcionando corretamente
              </div>
            )}
            {testStatus === 'failed' && (
              <div className="text-sm text-red-600 flex items-center mt-1">
                <X className="h-4 w-4 mr-1" /> 
                Falha na validação da API
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Modelos da OpenAI</p>
              <p>O sistema utiliza os modelos GPT-4o e DALL-E 3 para gerar histórias e imagens de alta qualidade para as histórias infantis.</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm">Como obter uma chave da API</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Acesse o <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">painel da OpenAI</a></li>
                  <li>Faça login na sua conta ou crie uma nova</li>
                  <li>Clique em "Create new secret key"</li>
                  <li>Dê um nome à sua chave e copie-a (ela só será mostrada uma vez)</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm">Sobre o uso do modelo</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Nossa aplicação utiliza:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>GPT-4o para geração de texto criativo e narrativas</li>
                    <li>DALL-E 3 para criação de ilustrações únicas</li>
                    <li>Parâmetros otimizados para histórias infantis</li>
                    <li>Cada história consome créditos da sua conta OpenAI</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearApiKey}>
          Limpar
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={testApiKey} 
            disabled={isLoading || !apiKey.trim()}
            className="flex items-center gap-1"
          >
            {testStatus === 'testing' ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <>Testar</>
            )}
          </Button>
          <Button onClick={saveApiKey} disabled={isLoading || !apiKey.trim()}>
            Salvar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default OpenAIApiKeyManager;
