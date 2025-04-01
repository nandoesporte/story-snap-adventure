
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const OpenAIApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');

  useEffect(() => {
    // Load the API key from localStorage when component initializes
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    // Load the saved model preference
    const savedModel = localStorage.getItem('openai_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API válida');
      return;
    }

    localStorage.setItem('openai_api_key', apiKey.trim());
    localStorage.setItem('openai_model', selectedModel);
    toast.success('Configurações da API OpenAI salvas com sucesso');
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API para testar');
      return;
    }

    setIsLoading(true);
    setTestStatus('testing');

    try {
      // Call OpenAI API to test the key using the selected model
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: selectedModel,
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
      
      // Automatically save the key and model if the test is successful
      localStorage.setItem('openai_api_key', apiKey.trim());
      localStorage.setItem('openai_model', selectedModel);
      
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

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
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
          
          <div className="space-y-2">
            <Label htmlFor="openaiModel">Modelo OpenAI</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger id="openaiModel">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Mais poderoso)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Mais rápido, mais barato)</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais rápido e econômico)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              O modelo selecionado será usado para toda a geração de conteúdo no sistema.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start">
            <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Modelos da OpenAI</p>
              <p>O sistema utiliza os modelos GPT-4o, GPT-4o Mini ou GPT-3.5 Turbo para gerar histórias, e DALL-E 3 para gerar imagens de alta qualidade para as histórias infantis.</p>
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
              <AccordionTrigger className="text-sm">Comparação entre modelos</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <ul className="list-disc list-inside pl-2 space-y-2">
                    <li><span className="font-semibold">GPT-4o:</span> O modelo mais avançado, com excelente compreensão de contexto e criatividade. Ideal para histórias mais complexas e elaboradas. Mais caro por token.</li>
                    <li><span className="font-semibold">GPT-4o Mini:</span> Versão mais leve do GPT-4o com bom equilíbrio entre qualidade e custo. Bom para a maioria das histórias infantis.</li>
                    <li><span className="font-semibold">GPT-3.5 Turbo:</span> Modelo mais econômico e rápido. Adequado para histórias simples e quando o custo é uma preocupação.</li>
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
