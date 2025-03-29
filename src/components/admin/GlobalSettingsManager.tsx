
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, RefreshCw, Check, Wand2, Volume, Info } from 'lucide-react';
import GoogleTTSApiKeyManager from './GoogleTTSApiKeyManager';
import GeminiApiKeyManager from './GeminiApiKeyManager';

const GlobalSettingsManager = () => {
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [leonardoApiKey, setLeonardoApiKey] = useState('');
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState('');
  const [imagePromptTemplate, setImagePromptTemplate] = useState('');
  const [preferredModel, setPreferredModel] = useState('gemini');
  const [openaiModelType, setOpenaiModelType] = useState('gpt-4o-mini');
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Create table if it doesn't exist
      await supabase.rpc('create_app_config_if_not_exists');
      
      // Fetch all settings
      const { data, error } = await supabase
        .from('app_config')
        .select('key, value')
        .in('key', [
          'openai_api_key',
          'leonardo_api_key',
          'elevenlabs_api_key',
          'image_prompt_template',
          'preferred_ai_model',
          'openai_model_type',
          'use_openai'
        ]);
      
      if (error) {
        console.error('Error loading settings:', error);
        toast.error('Erro ao carregar configurações');
        return;
      }
      
      if (data) {
        data.forEach(item => {
          switch (item.key) {
            case 'openai_api_key':
              setOpenaiApiKey(item.value);
              break;
            case 'leonardo_api_key':
              setLeonardoApiKey(item.value);
              break;
            case 'elevenlabs_api_key':
              setElevenlabsApiKey(item.value);
              break;
            case 'image_prompt_template':
              setImagePromptTemplate(item.value);
              break;
            case 'preferred_ai_model':
              setPreferredModel(item.value);
              break;
            case 'openai_model_type':
              setOpenaiModelType(item.value);
              break;
            case 'use_openai':
              setUseOpenAI(item.value === 'true');
              break;
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Create table if it doesn't exist
      await supabase.rpc('create_app_config_if_not_exists');
      
      // Save settings
      const settingsToSave = [
        { key: 'openai_api_key', value: openaiApiKey },
        { key: 'leonardo_api_key', value: leonardoApiKey },
        { key: 'elevenlabs_api_key', value: elevenlabsApiKey },
        { key: 'image_prompt_template', value: imagePromptTemplate },
        { key: 'preferred_ai_model', value: preferredModel },
        { key: 'openai_model_type', value: openaiModelType },
        { key: 'use_openai', value: useOpenAI.toString() },
      ];
      
      // Update settings one by one
      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('app_config')
          .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
        
        if (error) {
          console.error(`Error saving setting ${setting.key}:`, error);
          toast.error(`Erro ao salvar configuração: ${setting.key}`);
          setIsSaving(false);
          return;
        }
      }
      
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const testOpenAiConnection = async () => {
    if (!openaiApiKey) {
      toast.error('Insira uma chave de API válida para testar');
      return;
    }

    toast.info('Testando conexão com a API OpenAI...');

    try {
      const { initializeOpenAI } = await import('@/lib/openai');
      const client = initializeOpenAI(openaiApiKey);
      
      if (!client) {
        toast.error('Falha ao conectar com OpenAI');
        return;
      }
      
      toast.success('Conexão com OpenAI estabelecida com sucesso');
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com a API OpenAI');
    }
  };

  const testLeonardoConnection = async () => {
    if (!leonardoApiKey) {
      toast.error('Insira uma chave de API Leonardo válida para testar');
      return;
    }

    toast.info('Testando conexão com a API Leonardo.ai...');

    try {
      const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${leonardoApiKey}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        toast.error(`Erro ao testar a API Leonardo: ${response.status}`);
        return;
      }
      
      toast.success('Conexão com Leonardo.ai estabelecida com sucesso');
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com a API Leonardo.ai');
    }
  };

  const testElevenLabsConnection = async () => {
    if (!elevenlabsApiKey) {
      toast.error('Insira uma chave de API ElevenLabs válida para testar');
      return;
    }

    toast.info('Testando narração com ElevenLabs...');

    try {
      const testText = "Este é um teste de narração usando a API do ElevenLabs. Se você ouvir esta mensagem, a configuração foi bem-sucedida.";
      const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Sarah (female voice)
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey,
        },
        body: JSON.stringify({
          text: testText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.7,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.play();
      
      toast.success('Narração ElevenLabs gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao testar narração:', error);
      toast.error('Falha ao gerar narração de teste com ElevenLabs');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-violet-600" />
          <p className="mt-2">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ai-models" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="ai-models">Modelos de IA</TabsTrigger>
          <TabsTrigger value="image-generation">Geração de Imagens</TabsTrigger>
          <TabsTrigger value="narration">Narração</TabsTrigger>
          <TabsTrigger value="image-prompts">Prompts de Imagem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai-models">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Modelos de IA</CardTitle>
              <CardDescription>
                Configure as chaves de API e preferências para geração de histórias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-openai" className="text-base">Usar OpenAI GPT-4</Label>
                  <Switch 
                    id="use-openai" 
                    checked={useOpenAI} 
                    onCheckedChange={setUseOpenAI}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    disabled={!useOpenAI}
                  />
                  <p className="text-sm text-gray-500">
                    Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">platform.openai.com/api-keys</a>
                  </p>
                </div>
                
                {useOpenAI && (
                  <div className="space-y-2 pt-2">
                    <Label>Modelo OpenAI</Label>
                    <RadioGroup value={openaiModelType} onValueChange={setOpenaiModelType}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gpt-4o-mini" id="gpt-4o-mini" />
                        <Label htmlFor="gpt-4o-mini" className="cursor-pointer">
                          GPT-4o Mini (mais rápido, mais barato)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gpt-4o" id="gpt-4o" />
                        <Label htmlFor="gpt-4o" className="cursor-pointer">
                          GPT-4o (mais poderoso)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                
                <div className="mt-6">
                  <GeminiApiKeyManager />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={testOpenAiConnection}
              >
                <Check className="mr-2 h-4 w-4" />
                Testar OpenAI
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="image-generation">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Geração de Imagens</CardTitle>
              <CardDescription>
                Configure a API Leonardo.ai para geração de ilustrações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="leonardo-api-key">Chave da API Leonardo.AI</Label>
                <Input
                  id="leonardo-api-key"
                  type="password"
                  placeholder="..."
                  value={leonardoApiKey}
                  onChange={(e) => setLeonardoApiKey(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Obtenha sua chave em <a href="https://leonardo.ai/settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">leonardo.ai/settings/api-keys</a>
                </p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Estilo Papercraft</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md overflow-hidden border shadow-sm">
                    <img 
                      src="/lovable-uploads/4d1a379f-0b24-48da-9f0f-e66feccc4e59.png" 
                      alt="Exemplo de ilustração papercraft" 
                      className="w-full h-auto object-cover"
                    />
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-500">Exemplo de ilustração no estilo papercraft</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Características do estilo:</h4>
                    <ul className="text-sm space-y-1 list-disc pl-5">
                      <li>Elementos que parecem recortados e colados em camadas</li>
                      <li>Texturas de papel visíveis</li>
                      <li>Efeito tridimensional como um livro pop-up</li>
                      <li>Cores vibrantes e saturadas</li>
                      <li>Bordas ligeiramente elevadas com sombras sutis</li>
                      <li>Composição central focando os personagens principais</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={testLeonardoConnection}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                Testar Conexão
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="narration">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Narração</CardTitle>
              <CardDescription>
                Configure as APIs de narração (Google TTS e ElevenLabs)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-6">
                <GoogleTTSApiKeyManager />
              </div>
              
              <div className="space-y-2 mt-6 pt-6 border-t">
                <Label htmlFor="elevenlabs-key">Chave da API ElevenLabs (Alternativa)</Label>
                <Input
                  id="elevenlabs-key"
                  type="password"
                  placeholder="..."
                  value={elevenlabsApiKey}
                  onChange={(e) => setElevenlabsApiKey(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Obtenha sua chave em <a href="https://elevenlabs.io/app/api-key" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">elevenlabs.io/app/api-key</a>
                </p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2">Vozes disponíveis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sarah (Feminina)</h4>
                        <p className="text-sm text-gray-500">ID: EXAVITQu4vr4xnSDxMaL</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1"
                        disabled={!elevenlabsApiKey}
                      >
                        <Volume className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Liam (Masculina)</h4>
                        <p className="text-sm text-gray-500">ID: TX3LPaxmHKxFdv7VOQHJ</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1"
                        disabled={!elevenlabsApiKey}
                      >
                        <Volume className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={testElevenLabsConnection}
                disabled={!elevenlabsApiKey}
                className="flex items-center gap-2"
              >
                <Volume className="mr-2 h-4 w-4" />
                Testar ElevenLabs
              </Button>
              <Button 
                onClick={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="image-prompts">
          <Card>
            <CardHeader>
              <CardTitle>Template de Prompts para Ilustrações</CardTitle>
              <CardDescription>
                Personalize o template usado para gerar ilustrações no estilo papercraft
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-prompt-template">Template para Geração de Ilustrações</Label>
                <Textarea
                  id="image-prompt-template"
                  placeholder="Insira o template para geração de ilustrações..."
                  className="min-h-[300px] font-mono text-sm"
                  value={imagePromptTemplate}
                  onChange={(e) => setImagePromptTemplate(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Este template será usado para a geração de ilustrações com Leonardo AI. 
                  As variáveis entre chaves {'{exemplo}'} são substituídas pelos dados da história.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border mt-4">
                <h4 className="text-sm font-medium mb-2">Variáveis disponíveis:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{personagem}'}</span> - Nome do personagem principal</p>
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{caracteristicas_do_personagem}'}</span> - Descrição do personagem</p>
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{cenario}'}</span> - Cenário da história</p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{tema}'}</span> - Tema da história</p>
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{elementos_da_cena}'}</span> - Elementos importantes da cena</p>
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{texto_da_pagina}'}</span> - Texto completo do prompt original</p>
                    <p><span className="font-mono bg-gray-100 px-1 rounded">{'{emocao}'}</span> - Emoção detectada na cena</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={saveSettings}
                disabled={isSaving}
              >
                {isSaving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalSettingsManager;
