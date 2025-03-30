
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';

import { UserManager } from '@/components/admin/UserManager';
import { ThemeManager } from '@/components/admin/ThemeManager';
import { StoryManager } from '@/components/admin/StoryManager';
import { CharacterManager } from '@/components/admin/CharacterManager';
import TestModeManager from '@/components/admin/TestModeManager';
import SubscriptionManager from '@/components/admin/SubscriptionManager';
import PaymentMethodsManager from '@/components/admin/PaymentMethodsManager';
import { StoryBotPromptManager } from '@/components/admin/StoryBotPromptManager';
import GoogleTTSApiKeyManager from '@/components/admin/GoogleTTSApiKeyManager';
import MercadoPagoApiKeyManager from '@/components/admin/MercadoPagoApiKeyManager';
import AsaasApiKeyManager from '@/components/admin/AsaasApiKeyManager';
import LeonardoWebhookConfig from '@/components/LeonardoWebhookConfig';

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const [activeTab, setActiveTab] = useState('users');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p className="mb-6 text-center">
          Esta área é restrita a administradores. Você não tem permissão para acessar esta página.
        </p>
        <Button onClick={() => navigate('/')}>Voltar para a Página Inicial</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Painel de Administração</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Logado como: {user?.email}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 h-auto gap-2">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="stories">Histórias</TabsTrigger>
            <TabsTrigger value="themes">Temas & Personagens</TabsTrigger>
            <TabsTrigger value="subscription">Assinaturas</TabsTrigger>
            <TabsTrigger value="payment">Pagamentos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManager />
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            <StoryManager />
          </TabsContent>

          <TabsContent value="themes" className="space-y-8">
            <ThemeManager />
            <Separator />
            <CharacterManager />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="payment" className="space-y-8">
            <PaymentMethodsManager />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MercadoPagoApiKeyManager />
              <AsaasApiKeyManager />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <GoogleTTSApiKeyManager />
            <Separator />
            <StoryBotPromptManager />
            <Separator />
            <LeonardoWebhookConfig />
            <Separator />
            <TestModeManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
