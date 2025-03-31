
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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
import LeonardoWebhookConfig from '@/components/LeonardoWebhookConfig';
import FeaturedStoryManager from '@/components/admin/FeaturedStoryManager';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdminCheck();
  const [activeTab, setActiveTab] = useState('users');
  const [manualAdminOverride, setManualAdminOverride] = useState(false);
  const [adminAttemptCount, setAdminAttemptCount] = useState(0);

  // Get tab from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Try to manually set admin status for known admin email
  const attemptManualAdminFix = async () => {
    if (!user || user.email !== 'nandoesporte1@gmail.com') {
      toast.error('Esta ação só é permitida para administradores');
      return;
    }

    setAdminAttemptCount(prev => prev + 1);
    
    try {
      toast.info('Tentando corrigir status de administrador...');
      
      // Direct database update
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: user.email,
          story_credits: 5,
          is_admin: true
        });
        
      if (error) {
        console.error('Erro ao configurar status de admin:', error);
        toast.error('Erro ao configurar permissões. Tentando método alternativo...');
        
        // Try raw SQL approach through RPC
        try {
          await supabase.rpc('exec_sql', {
            sql_query: `
              INSERT INTO public.user_profiles (id, display_name, story_credits, is_admin)
              VALUES ('${user.id}', '${user.email}', 5, true)
              ON CONFLICT (id) DO UPDATE
              SET is_admin = true
            `
          });
          
          toast.success('Permissões de administrador atualizadas! Recarregando...');
          setManualAdminOverride(true);
          setTimeout(() => window.location.reload(), 1500);
        } catch (rpcError) {
          console.error('Erro no método alternativo:', rpcError);
          toast.error('Não foi possível configurar permissões de administrador');
        }
      } else {
        toast.success('Permissões de administrador atualizadas! Recarregando...');
        setManualAdminOverride(true);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      console.error('Erro inesperado:', e);
      toast.error('Erro ao configurar permissões de administrador');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mx-auto mb-4"></div>
          <p className="text-lg">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin && !manualAdminOverride) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              Esta área é restrita a administradores. Você não tem permissão para acessar esta página.
            </AlertDescription>
          </Alert>
          
          {user && user.email === 'nandoesporte1@gmail.com' && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <h3 className="text-amber-800 font-medium mb-2 flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Problema de permissões detectado
              </h3>
              <p className="text-amber-700 text-sm mb-4">
                Seu email ({user.email}) deveria ter acesso de administrador, mas parece que as permissões não estão configuradas corretamente no banco de dados.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800"
                onClick={attemptManualAdminFix}
                disabled={adminAttemptCount >= 3}
              >
                {adminAttemptCount >= 3 
                  ? "Número máximo de tentativas alcançado" 
                  : "Corrigir permissões de administrador"}
              </Button>
            </div>
          )}
          
          <Button onClick={() => navigate('/')} className="w-full">
            Voltar para a Página Inicial
          </Button>
        </div>
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
            <TabsTrigger value="featured">História do Mês</TabsTrigger>
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
          
          <TabsContent value="featured" className="space-y-4">
            <FeaturedStoryManager />
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
            <MercadoPagoApiKeyManager />
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
