
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
import { Textarea } from '@/components/ui/textarea';
import { LeonardoAIAgent } from '@/services/LeonardoAIAgent';
import GoogleTTSApiKeyManager from '@/components/admin/GoogleTTSApiKeyManager';

const Settings = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [leonardoApiKey, setLeonardoApiKey] = useState('');
  const [imagePromptTemplate, setImagePromptTemplate] = useState('');
  const [preferredModel, setPreferredModel] = useState('gemini');
  const [openaiModelType, setOpenaiModelType] = useState('gpt-4o-mini');
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';
    const savedOpenAIKey = localStorage.getItem('openai_api_key') || '';
    const savedLeonardoKey = localStorage.getItem('leonardo_api_key') || '';
    const savedImagePromptTemplate = localStorage.getItem('image_prompt_template') || '';
    const savedPreferredModel = localStorage.getItem('preferred_ai_model') || 'gemini';
    const savedOpenAIModel = localStorage.getItem('openai_model_type') || 'gpt-4o-mini';
    const savedUseOpenAI = localStorage.getItem('use_openai') === 'true';
    
    setGeminiApiKey(savedGeminiKey);
    setOpenaiApiKey(savedOpenAIKey);
    setLeonardoApiKey(savedLeonardoKey);
    setImagePromptTemplate(savedImagePromptTemplate);
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

  const testImageGeneration = async () => {
    if (!leonardoApiKey) {
      toast.error('Configure a chave da API Leonardo.ai antes de testar');
      return;
    }

    toast.info('Testando geração de imagem...');

    try {
      const leonardoAgent = new LeonardoAIAgent();
      
      // Definir a chave da API
      leonardoAgent.setApiKey(leonardoApiKey);
      
      if (!leonardoAgent.isAgentAvailable()) {
        toast.error('Agente Leonardo.ai não está disponível. Verifique a chave da API');
        return;
      }
      
      // Salvar o template de prompt no localStorage antes de testar
      if (imagePromptTemplate) {
        localStorage.setItem('image_prompt_template', imagePromptTemplate);
      }
      
      // Gerar uma imagem de teste
      const imageUrl = await leonardoAgent.generateImage({
        prompt: "Uma raposa laranja com roupas verdes em uma floresta colorida, cercada por árvores e flores",
        characterName: "Raposa Aventureira",
        theme: "adventure",
        setting: "forest",
        style: "papercraft",
        characterPrompt: "Raposa de pelo laranja vibrante, com roupas verdes de aventureiro, olhos grandes e expressivos, e uma cauda fofa",
        storyContext: "A Raposa Aventureira explorando a Floresta Encantada"
      });
      
      if (imageUrl) {
        toast.success('Imagem gerada com sucesso!');
        // Mostrar imagem gerada
        window.open(imageUrl, '_blank');
      } else {
        toast.error('Falha ao gerar imagem');
      }
    } catch (error) {
      console.error('Erro ao testar geração de imagem:', error);
      toast.error('Erro ao gerar imagem de teste');
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
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="ai-models">Modelos de IA</TabsTrigger>
              <TabsTrigger value="image-generation">Geração de Imagens</TabsTrigger>
              <TabsTrigger value="narration">Narração</TabsTrigger>
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
                    onClick={testImageGeneration}
                    className="flex items-center gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Testar Geração
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
            
            <TabsContent value="narration">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Narração</CardTitle>
                  <CardDescription>
                    Configure a API Google Text-to-Speech para narração de histórias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleTTSApiKeyManager />
                </CardContent>
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
