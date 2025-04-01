
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GoogleTTSApiKeyManager from "@/components/admin/GoogleTTSApiKeyManager";
import AsaasApiKeyManager from "@/components/admin/AsaasApiKeyManager";
import MercadoPagoApiKeyManager from "@/components/admin/MercadoPagoApiKeyManager";
import OpenAIApiKeyManager from "@/components/admin/OpenAIApiKeyManager";
import ImageGenerationManager from "@/components/admin/ImageGenerationManager";
import LeonardoAIStatusCheck from "@/components/admin/LeonardoAIStatusCheck";

const SystemConfigurationManager = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Sistema</CardTitle>
        <CardDescription>
          Configure as APIs e serviços externos utilizados pelo sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leonardo-ai" className="w-full">
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="leonardo-ai">Leonardo AI</TabsTrigger>
            <TabsTrigger value="image-generation">Geração de Imagens</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="google-tts">Google TTS</TabsTrigger>
            <TabsTrigger value="mercadopago">MercadoPago</TabsTrigger>
            <TabsTrigger value="asaas">Asaas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leonardo-ai">
            <LeonardoAIStatusCheck />
          </TabsContent>
          
          <TabsContent value="image-generation">
            <ImageGenerationManager />
          </TabsContent>
          
          <TabsContent value="openai">
            <OpenAIApiKeyManager />
          </TabsContent>
          
          <TabsContent value="google-tts">
            <GoogleTTSApiKeyManager />
          </TabsContent>
          
          <TabsContent value="mercadopago">
            <MercadoPagoApiKeyManager />
          </TabsContent>
          
          <TabsContent value="asaas">
            <AsaasApiKeyManager />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SystemConfigurationManager;
