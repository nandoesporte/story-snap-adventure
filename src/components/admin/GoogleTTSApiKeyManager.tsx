
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

const GoogleTTSApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  useEffect(() => {
    // Carregar a chave armazenada no localStorage ao inicializar
    const savedKey = localStorage.getItem('google_tts_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API válida');
      return;
    }

    localStorage.setItem('google_tts_api_key', apiKey.trim());
    toast.success('Chave da API Google Text-to-Speech salva com sucesso');
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API para testar');
      return;
    }

    setIsLoading(true);
    setTestStatus('testing');

    try {
      // Texto curto para teste com SSML para narração mais humanizada
      const ssmlText = '<speak>Este é um teste de <emphasis level="moderate">síntese de voz humanizada</emphasis> para histórias infantis.<break time="500ms"/> Como está soando?</speak>';
      
      // Configuração aprimorada para teste com voz WaveNet em português
      const requestBody = {
        input: { ssml: ssmlText },
        voice: { 
          languageCode: "pt-BR", 
          name: "pt-BR-Wavenet-A" // Voz feminina WaveNet em português
        },
        audioConfig: { 
          audioEncoding: "MP3",
          pitch: 0.5,
          speakingRate: 0.85,
          volumeGainDb: 2.0,
          effectsProfileId: ["small-bluetooth-speaker-class-device"]
        }
      };

      // Fazer requisição para a API Google TTS
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta da API Google TTS:', errorData);
        throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
      }

      // Se chegou aqui, o teste foi bem-sucedido
      setTestStatus('success');
      toast.success('Teste realizado com sucesso. A chave da API Google TTS está funcionando para narrações humanizadas.');
      
      // Automaticamente salvar a chave se o teste for bem-sucedido
      localStorage.setItem('google_tts_api_key', apiKey.trim());
      
    } catch (error) {
      console.error('Erro ao testar a API Google TTS:', error);
      setTestStatus('failed');
      toast.error(`Falha no teste da API: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('google_tts_api_key');
    setApiKey('');
    setTestStatus('idle');
    toast.info('Chave da API Google Text-to-Speech removida');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da API Google Text-to-Speech</CardTitle>
        <CardDescription>
          Configure sua chave de API para acessar o serviço Google Text-to-Speech para narrações humanizadas de histórias infantis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              id="googleTtsApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua chave da API Google Text-to-Speech"
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
              <p className="font-medium mb-1">Narração aprimorada para crianças</p>
              <p>Nossa aplicação agora utiliza tecnologia avançada WaveNet com SSML para criar narrações mais naturais e humanizadas, adequadas para histórias infantis.</p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm">Como obter uma chave da API</AccordionTrigger>
              <AccordionContent>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Crie um novo projeto ou selecione um existente</li>
                  <li>Ative a API Text-to-Speech</li>
                  <li>Crie credenciais de API e copie a chave</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-sm">Sobre as vozes humanizadas</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Nossa aplicação utiliza:</p>
                  <ul className="list-disc list-inside pl-2 space-y-1">
                    <li>Vozes WaveNet para som mais natural</li>
                    <li>SSML para adicionar pausas e ênfases</li>
                    <li>Configurações de tom e ritmo adequadas para crianças</li>
                    <li>Perfis de efeitos otimizados para dispositivos móveis</li>
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

export default GoogleTTSApiKeyManager;
