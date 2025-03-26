
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, RefreshCw, Check } from 'lucide-react';
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

const Settings = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [leonardoWebhookUrl, setLeonardoWebhookUrl] = useState('');
  const [preferredModel, setPreferredModel] = useState('gemini');
  const [openaiModelType, setOpenaiModelType] = useState('gpt-4o-mini');
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';
    const savedOpenAIKey = localStorage.getItem('openai_api_key') || '';
    const savedLeonardoUrl = localStorage.getItem('leonardo_webhook_url') || '';
    const savedPreferredModel = localStorage.getItem('preferred_ai_model') || 'gemini';
    const savedOpenAIModel = localStorage.getItem('openai_model_type') || 'gpt-4o-mini';
    const savedUseOpenAI = localStorage.getItem('use_openai') === 'true';
    
    setGeminiApiKey(savedGeminiKey);
    setOpenaiApiKey(savedOpenAIKey);
    setLeonardoWebhookUrl(savedLeonardoUrl);
    setPreferredModel(savedPreferredModel);
    setOpenaiModelType(savedOpenAIModel);
    setUseOpenAI(savedUseOpenAI);
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Save Gemini API key
      if (geminiApiKey) {
        const success = BookGenerationService.setGeminiApiKey(geminiApiKey);
        if (!success) {
          toast.error('Erro ao salvar a chave da API Gemini');
          setIsSaving(false);
          return;
        }
      }
      
      // Save OpenAI API key
      if (openaiApiKey) {
        localStorage.setItem('openai_api_key', openaiApiKey);
      }
      
      // Save Leonardo webhook URL
      if (leonardoWebhookUrl) {
        localStorage.setItem('leonardo_webhook_url', leonardoWebhookUrl);
      }
      
      // Save AI model preferences
      localStorage.setItem('preferred_ai_model', preferredModel);
      localStorage.setItem('openai_model_type', openaiModelType);
      localStorage.setItem('use_openai', useOpenAI.toString());
      
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
      if (useOpenAI && openaiApiKey) {
        // Test OpenAI connection
        const { initializeOpenAI } = await import('@/lib/openai');
        const client = initializeOpenAI(openaiApiKey);
        
        if (!client) {
          toast.error('Falha ao conectar com OpenAI');
          setTestingConnection(false);
          return;
        }
        
        toast.success('Conexão com OpenAI estabelecida com sucesso');
      } else if (geminiApiKey) {
        // Test Gemini connection
        const isValid = BookGenerationService.isGeminiApiKeyValid();
        
        if (!isValid) {
          toast.error('Chave da API Gemini inválida');
          setTestingConnection(false);
          return;
        }
        
        toast.success('Conexão com Gemini estabelecida com sucesso');
      } else {
        toast.error('Nenhuma chave de API configurada');
      }
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="use-openai" className="text-base">Usar OpenAI GPT-4</Label>
                      <Switch 
                        id="use-openai" 
                        checked={useOpenAI} 
                        onCheckedChange={setUseOpenAI}
                      />
                    </div>
                    
                    <Separator />
                    
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
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="gemini-key" className={useOpenAI ? "text-gray-500" : ""}>
                        Chave da API Gemini (alternativa)
                      </Label>
                      <Input
                        id="gemini-key"
                        type="password"
                        placeholder="AI..."
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className={useOpenAI ? "bg-gray-50" : ""}
                      />
                      <p className="text-sm text-gray-500">
                        Obtenha sua chave em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">aistudio.google.com/app/apikey</a>
                      </p>
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
                    Configure as APIs para geração de ilustrações para as histórias
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="leonardo-webhook">URL do Webhook Leonardo.AI</Label>
                    <Input
                      id="leonardo-webhook"
                      type="text"
                      placeholder="https://..."
                      value={leonardoWebhookUrl}
                      onChange={(e) => setLeonardoWebhookUrl(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Configure o webhook no <a href="https://app.leonardo.ai/webhooks" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Leonardo.AI</a> para receber imagens geradas
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="ml-auto"
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
