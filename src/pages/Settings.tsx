
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Label } from '@/components/ui/label';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("");
  const [googleTtsApiKey, setGoogleTtsApiKey] = useState<string>("");
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState<string>("");
  const [leonardoApiKey, setLeonardoApiKey] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Load keys from localStorage
    const loadKeys = () => {
      const openai = localStorage.getItem("openai_api_key") || "";
      const google = localStorage.getItem("google_tts_api_key") || "";
      const eleven = localStorage.getItem("elevenlabs_api_key") || "";
      const leonardo = localStorage.getItem("leonardo_api_key") || "";
      
      setOpenaiApiKey(openai);
      setGoogleTtsApiKey(google);
      setElevenlabsApiKey(eleven);
      setLeonardoApiKey(leonardo);
    };
    
    loadKeys();
  }, []);

  const saveApiKeys = () => {
    setIsSaving(true);
    
    try {
      localStorage.setItem("openai_api_key", openaiApiKey);
      localStorage.setItem("google_tts_api_key", googleTtsApiKey);
      localStorage.setItem("elevenlabs_api_key", elevenlabsApiKey);
      localStorage.setItem("leonardo_api_key", leonardoApiKey);
      
      toast.success("Chaves de API salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar chaves de API:", error);
      toast.error("Erro ao salvar chaves de API. Verifique o console para mais detalhes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold">Configurações</h1>
        
        <Tabs defaultValue="api-keys" className="mt-6">
          <TabsList>
            <TabsTrigger value="api-keys">Chaves de API</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Configure suas chaves de API para utilizar serviços externos de geração de conteúdo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                  <Input
                    id="openai-api-key"
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <p className="text-xs text-gray-500">
                    Necessária para geração de textos e imagens. Obtenha em{" "}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      platform.openai.com
                    </a>
                  </p>
                </div>
                
                {/* Google TTS API Key */}
                <div className="space-y-2">
                  <Label htmlFor="google-tts-api-key">Google Text-to-Speech API Key</Label>
                  <Input
                    id="google-tts-api-key"
                    type="password"
                    value={googleTtsApiKey}
                    onChange={(e) => setGoogleTtsApiKey(e.target.value)}
                    placeholder="AIza..."
                  />
                  <p className="text-xs text-gray-500">
                    Necessária para narração de histórias. Obtenha no{" "}
                    <a 
                      href="https://console.cloud.google.com/apis/credentials" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Google Cloud Console
                    </a>
                  </p>
                </div>
                
                {/* ElevenLabs API Key */}
                <div className="space-y-2">
                  <Label htmlFor="elevenlabs-api-key">ElevenLabs API Key</Label>
                  <Input
                    id="elevenlabs-api-key"
                    type="password"
                    value={elevenlabsApiKey}
                    onChange={(e) => setElevenlabsApiKey(e.target.value)}
                    placeholder="11..."
                  />
                  <p className="text-xs text-gray-500">
                    Para narração de histórias de alta qualidade. Obtenha em{" "}
                    <a 
                      href="https://elevenlabs.io/speech-synthesis" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      elevenlabs.io
                    </a>
                  </p>
                </div>
                
                {/* Leonardo API Key */}
                <div className="space-y-2">
                  <Label htmlFor="leonardo-api-key">Leonardo.AI API Key</Label>
                  <Input
                    id="leonardo-api-key"
                    type="password"
                    value={leonardoApiKey}
                    onChange={(e) => setLeonardoApiKey(e.target.value)}
                    placeholder="..."
                  />
                  <p className="text-xs text-gray-500">
                    Para geração de imagens. Obtenha em{" "}
                    <a 
                      href="https://leonardo.ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      leonardo.ai
                    </a>
                  </p>
                </div>
                
                <Button 
                  onClick={saveApiKeys} 
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar Chaves API"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Conta</CardTitle>
                <CardDescription>
                  Gerencie as informações da sua conta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Usuário atual: {user?.email || "Não logado"}</p>
                <p className="mt-4 text-gray-500">Mais configurações de conta serão implementadas em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>
                  Personalize sua experiência.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Preferências serão implementadas em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
