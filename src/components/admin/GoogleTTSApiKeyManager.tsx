
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCw, Check, X, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const GoogleTTSApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [defaultVoice, setDefaultVoice] = useState<'male' | 'female'>('female');
  const [maleVoice, setMaleVoice] = useState('pt-BR-Standard-B');
  const [femaleVoice, setFemaleVoice] = useState('pt-BR-Standard-A');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const maleVoiceOptions = [
    { value: 'pt-BR-Standard-B', label: 'Português BR - Masculino (Padrão)' },
    { value: 'pt-BR-Neural2-B', label: 'Português BR - Masculino (Neural)' },
    { value: 'pt-PT-Standard-B', label: 'Português PT - Masculino (Padrão)' },
    { value: 'pt-PT-Neural2-B', label: 'Português PT - Masculino (Neural)' },
    { value: 'en-US-Standard-B', label: 'Inglês US - Masculino (Padrão)' },
    { value: 'en-US-Neural2-D', label: 'Inglês US - Masculino (Neural)' }
  ];

  const femaleVoiceOptions = [
    { value: 'pt-BR-Standard-A', label: 'Português BR - Feminino (Padrão)' },
    { value: 'pt-BR-Neural2-A', label: 'Português BR - Feminino (Neural)' },
    { value: 'pt-PT-Standard-A', label: 'Português PT - Feminino (Padrão)' },
    { value: 'pt-PT-Neural2-A', label: 'Português PT - Feminino (Neural)' },
    { value: 'en-US-Standard-C', label: 'Inglês US - Feminino (Padrão)' },
    { value: 'en-US-Neural2-A', label: 'Inglês US - Feminino (Neural)' }
  ];

  useEffect(() => {
    // Load the API key and voice settings from the database
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoadingConfig(true);
    try {
      // Create table if it doesn't exist
      await supabase.rpc('create_app_config_if_not_exists');
      
      // Load API key
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'google_tts_api_key')
        .single();
      
      if (!apiKeyError && apiKeyData) {
        setApiKey(apiKeyData.value);
      }
      
      // Load voice settings
      const { data: defaultVoiceData, error: defaultVoiceError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'default_tts_voice_type')
        .single();
      
      if (!defaultVoiceError && defaultVoiceData) {
        setDefaultVoice(defaultVoiceData.value as 'male' | 'female');
      }
      
      const { data: maleVoiceData, error: maleVoiceError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'male_tts_voice')
        .single();
      
      if (!maleVoiceError && maleVoiceData) {
        setMaleVoice(maleVoiceData.value);
      }
      
      const { data: femaleVoiceData, error: femaleVoiceError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'female_tts_voice')
        .single();
      
      if (!femaleVoiceError && femaleVoiceData) {
        setFemaleVoice(femaleVoiceData.value);
      }
    } catch (error) {
      console.error('Error loading Google TTS config:', error);
      toast.error('Erro ao carregar configurações de voz');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API válida');
      return;
    }

    setIsLoading(true);
    try {
      // Create table if it doesn't exist
      await supabase.rpc('create_app_config_if_not_exists');
      
      // Save API key
      const { error } = await supabase
        .from('app_config')
        .upsert({ key: 'google_tts_api_key', value: apiKey.trim() }, { onConflict: 'key' });
      
      if (error) {
        console.error('Error saving Google TTS API key:', error);
        toast.error('Erro ao salvar chave da API Google TTS');
        return;
      }
      
      toast.success('Chave da API Google Text-to-Speech salva com sucesso');
    } catch (error) {
      console.error('Error saving Google TTS API key:', error);
      toast.error('Erro ao salvar chave da API Google TTS');
    } finally {
      setIsLoading(false);
    }
  };

  const saveVoiceSettings = async () => {
    setIsLoading(true);
    try {
      // Create table if it doesn't exist
      await supabase.rpc('create_app_config_if_not_exists');
      
      // Save voice settings
      const settingsToSave = [
        { key: 'default_tts_voice_type', value: defaultVoice },
        { key: 'male_tts_voice', value: maleVoice },
        { key: 'female_tts_voice', value: femaleVoice }
      ];
      
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('app_config')
          .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
        
        if (error) {
          console.error(`Error saving setting ${setting.key}:`, error);
          toast.error(`Erro ao salvar configuração: ${setting.key}`);
          setIsLoading(false);
          return;
        }
      }
      
      toast.success('Configurações de voz salvas com sucesso');
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast.error('Erro ao salvar configurações de voz');
    } finally {
      setIsLoading(false);
    }
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Por favor, insira uma chave API para testar');
      return;
    }

    setIsLoading(true);
    setTestStatus('testing');

    try {
      // Texto curto para teste
      const testText = "Este é um teste de síntese de voz com Google Text-to-Speech.";
      
      // Configuração padrão para teste com voz em português
      const requestBody = {
        input: { text: testText },
        voice: { 
          languageCode: "pt-BR", 
          name: femaleVoice 
        },
        audioConfig: { audioEncoding: "MP3" }
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

      const result = await response.json();
      
      // Decodificar áudio base64 e reproduzir
      const audioContent = result.audioContent;
      const audioBlob = new Blob([Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();

      // Se chegou aqui, o teste foi bem-sucedido
      setTestStatus('success');
      toast.success('Teste realizado com sucesso. A chave da API Google TTS está funcionando.');
      
      // Automaticamente salvar a chave se o teste for bem-sucedido
      await saveApiKey();
      
    } catch (error) {
      console.error('Erro ao testar a API Google TTS:', error);
      setTestStatus('failed');
      toast.error(`Falha no teste da API: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <RotateCw className="h-6 w-6 animate-spin mx-auto text-violet-600" />
          <p className="mt-2 text-sm">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da API Google Text-to-Speech</CardTitle>
        <CardDescription>
          Configure sua chave de API para acessar o serviço Google Text-to-Speech para narrações de histórias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="googleTtsApiKey">Chave da API Google TTS</Label>
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
          
          <div className="pt-4 border-t mt-4">
            <h3 className="text-base font-medium mb-3">Configurações de Voz</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Voz Padrão</Label>
                <RadioGroup value={defaultVoice} onValueChange={(value) => setDefaultVoice(value as 'male' | 'female')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female-voice" />
                    <Label htmlFor="female-voice">Feminina</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male-voice" />
                    <Label htmlFor="male-voice">Masculina</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="female-voice-select">Voz Feminina</Label>
                <Select 
                  value={femaleVoice} 
                  onValueChange={setFemaleVoice}
                >
                  <SelectTrigger id="female-voice-select">
                    <SelectValue placeholder="Selecione uma voz feminina" />
                  </SelectTrigger>
                  <SelectContent>
                    {femaleVoiceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="male-voice-select">Voz Masculina</Label>
                <Select 
                  value={maleVoice} 
                  onValueChange={setMaleVoice}
                >
                  <SelectTrigger id="male-voice-select">
                    <SelectValue placeholder="Selecione uma voz masculina" />
                  </SelectTrigger>
                  <SelectContent>
                    {maleVoiceOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4">
            <p>Como obter uma chave da API:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Crie um novo projeto ou selecione um existente</li>
              <li>Ative a API Text-to-Speech</li>
              <li>Crie credenciais de API e copie a chave</li>
            </ol>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={saveVoiceSettings} disabled={isLoading}>
          {isLoading ? (
            <RotateCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Vozes
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={testApiKey} 
            disabled={isLoading || !apiKey.trim()}
            className="flex items-center gap-1"
          >
            {testStatus === 'testing' ? (
              <RotateCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            Testar
          </Button>
          <Button onClick={saveApiKey} disabled={isLoading || !apiKey.trim()}>
            Salvar Chave
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default GoogleTTSApiKeyManager;
