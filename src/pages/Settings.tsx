
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Check, Wand2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { BookGenerationService } from '@/services/BookGenerationService';
import { useAuth } from '@/context/AuthContext';
import { LeonardoAIAgent } from '@/services/LeonardoAIAgent';
import GoogleTTSApiKeyManager from '@/components/admin/GoogleTTSApiKeyManager';

const Settings = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [leonardoApiKey, setLeonardoApiKey] = useState('');
  const [imagePromptTemplate, setImagePromptTemplate] = useState('');
  const [preferredModel, setPreferredModel] = useState('openai');
  const [openaiModelType, setOpenaiModelType] = useState('gpt-4o-mini');
  const [useOpenAI, setUseOpenAI] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedOpenAIKey = localStorage.getItem('openai_api_key') || '';
    const savedLeonardoKey = localStorage.getItem('leonardo_api_key') || '';
    const savedImagePromptTemplate = localStorage.getItem('image_prompt_template') || '';
    const savedPreferredModel = localStorage.getItem('preferred_ai_model') || 'openai';
    const savedOpenAIModel = localStorage.getItem('openai_model') || 'gpt-4o-mini';
    
    setOpenaiApiKey(savedOpenAIKey);
    setLeonardoApiKey(savedLeonardoKey);
    setImagePromptTemplate(savedImagePromptTemplate);
    setPreferredModel(savedPreferredModel);
    setOpenaiModelType(savedOpenAIModel);
    setUseOpenAI(true);
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save OpenAI API key
      if (openaiApiKey) {
        localStorage.setItem('openai_api_key', openaiApiKey);
      }
      
      // Save Leonardo API key
      if (leonardoApiKey) {
        localStorage.setItem('leonardo_api_key', leonardoApiKey);
      }
      
      // Save image prompt template
      if (imagePromptTemplate) {
        localStorage.setItem('image_prompt_template', imagePromptTemplate);
      }
      
      // Save AI model preferences
      localStorage.setItem('preferred_ai_model', preferredModel);
      localStorage.setItem('openai_model', openaiModelType);
      localStorage.setItem('use_openai', 'true');
      
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const testApiConnection = async () => {
    setTestingConnection(true);
    try {
      const { initializeOpenAI } = await import('@/lib/openai');
      const client = initializeOpenAI(openaiApiKey);
      
      if (!client) {
        toast.error('Falha ao conectar com OpenAI');
        setTestingConnection(false);
        return;
      }
      
      // Test the connection with the selected model
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey.trim()}`
        },
        body: JSON.stringify({
          model: openaiModelType,
          messages: [{ role: 'user', content: 'Hello, this is a test.' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na resposta da API OpenAI:', errorData);
        throw new Error(`Erro na resposta da API: ${response.status} ${response.statusText}`);
      }
      
      toast.success('Conexão com OpenAI estabelecida com sucesso');
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão com a API');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <motion.div
        className="flex-grow py-10 px-4 bg-gradient-to-b from-violet-50 to-indigo-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-violet-800 mb-8">Configurações</h1>
          
          <Tabs defaultValue="ai-models" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="ai-models">Modelos de IA</TabsTrigger>
              <TabsTrigger value="image-generation">Geração de Imagens</TabsTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">platform.openai.com/api-keys</a>
                    </p>
                    
                    <div className="space-y-2 pt-4">
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
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="gpt-3.5-turbo" id="gpt-3.5-turbo" />
                          <Label htmlFor="gpt-3.5-turbo" className="cursor-pointer">
                            GPT-3.5 Turbo (mais econômico)
                          </Label>
                        </div>
                      </RadioGroup>
                      
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Comparação:</span> O GPT-4o é mais poderoso para histórias complexas, o GPT-4o Mini oferece bom equilíbrio entre qualidade e custo, e o GPT-3.5 Turbo é o mais econômico para histórias simples.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={testApiConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Testar Conexão
                  </Button>
                  <Button 
                    onClick={handleSaveSettings}
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
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    onClick={handleSaveSettings}
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
          </Tabs>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default Settings;
