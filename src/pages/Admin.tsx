import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { StoryManager } from "@/components/admin/StoryManager";
import { UserManager } from "@/components/admin/UserManager";
import { CharacterManager } from "@/components/admin/CharacterManager";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { StoryBotPromptManager } from "@/components/admin/StoryBotPromptManager";
import GoogleTTSApiKeyManager from "@/components/admin/GoogleTTSApiKeyManager";
import MercadoPagoApiKeyManager from "@/components/admin/MercadoPagoApiKeyManager";
import PaymentMethodsManager from "@/components/admin/PaymentMethodsManager";
import TestModeManager from "@/components/admin/TestModeManager";
import LeonardoWebhookConfig from "@/components/LeonardoWebhookConfig";
import SubscriptionManager from "@/components/admin/SubscriptionManager";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("stories");
  
  const { isAdmin, loading } = useAdminCheck();
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['stories', 'users', 'characters', 'themes', 'prompts', 'config', 'test', 'apis', 'subscriptions', 'payments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    if (!loading) {
      if (user === null) {
        console.log("Redirecting to auth: No user");
        navigate("/auth");
        toast.error("Faça login para acessar esta página");
      } else if (user && !isAdmin) {
        console.log("Redirecting to home: Not admin");
        navigate("/");
        toast.error("Você não tem permissão para acessar esta página");
      } else {
        console.log("Admin access allowed");
      }
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold">Verificando permissões...</h1>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto my-8 p-4">
        <h1 className="text-2xl font-bold">Verificando permissões...</h1>
      </div>
    );
  }

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Update URL with tab parameter
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', value);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="container mx-auto my-8 p-4">
      <h1 className="text-3xl font-bold mb-8">Painel de Administração</h1>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-10 w-full">
          <TabsTrigger value="stories">Histórias</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="characters">Personagens</TabsTrigger>
          <TabsTrigger value="themes">Temas</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="test">Modo Teste</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stories" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Histórias</h2>
          <StoryManager />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <UserManager />
        </TabsContent>
        
        <TabsContent value="characters" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Personagens</h2>
          <CharacterManager />
        </TabsContent>
        
        <TabsContent value="themes" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Temas</h2>
          <ThemeManager />
        </TabsContent>
        
        <TabsContent value="prompts" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Prompts</h2>
          <StoryBotPromptManager />
        </TabsContent>
        
        <TabsContent value="config" className="space-y-6">
          <h2 className="text-2xl font-bold">Configurações</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <GoogleTTSApiKeyManager />
          </div>
        </TabsContent>
        
        <TabsContent value="apis" className="space-y-4">
          <h2 className="text-2xl font-bold">Configuração de APIs</h2>
          <p className="text-muted-foreground mb-4">
            Configure as APIs para geração de histórias, imagens e processamento de pagamentos.
          </p>
          <div className="grid grid-cols-1 gap-6">
            <LeonardoWebhookConfig />
          </div>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <h2 className="text-2xl font-bold">Configuração de Pagamentos</h2>
          <p className="text-muted-foreground mb-4">
            Configure as opções de pagamento disponíveis para seus clientes.
          </p>
          <div className="grid grid-cols-1 gap-6">
            <PaymentMethodsManager />
            <MercadoPagoApiKeyManager />
          </div>
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          <h2 className="text-2xl font-bold">Modo de Teste</h2>
          <p className="text-muted-foreground mb-4">
            Gere histórias de teste sem usar APIs externas, facilitando testes do sistema.
          </p>
          <TestModeManager />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <h2 className="text-2xl font-bold">Gerenciar Assinaturas</h2>
          <p className="text-muted-foreground mb-4">
            Configure os planos de assinatura e gerencie as assinaturas dos usuários.
          </p>
          <SubscriptionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
