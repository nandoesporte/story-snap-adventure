import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SubscriptionPlanSelector } from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CircleCheck, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import supabase from '@/lib/supabase';

const Settings = () => {
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  
  // Clear error when component unmounts or user changes
  useEffect(() => {
    setErrorMessage(null);
  }, [user]);
  
  // Check if user is admin and if Stripe is configured
  useEffect(() => {
    const checkAdminAndStripeConfig = async () => {
      if (!user) {
        setCheckingConfig(false);
        return;
      }
      
      try {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
          
        setIsAdmin(profile?.is_admin || false);
        
        // Check if Stripe API key is configured
        const { data: stripeConfig, error: stripeConfigError } = await supabase
          .from('system_configurations')
          .select('value')
          .eq('key', 'stripe_api_key')
          .single();
          
        setStripeConfigured(!!stripeConfig?.value);
      } catch (error) {
        console.error('Error checking configurations:', error);
      } finally {
        setCheckingConfig(false);
      }
    };
    
    checkAdminAndStripeConfig();
  }, [user]);
  
  if (loading || checkingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Carregando...</p>
      </div>
    );
  }
  
  const handleError = (error: string) => {
    setErrorMessage(error);
    toast.error(error);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        {!user && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-amber-800">Você não está logado</h3>
                <p className="text-amber-700">Faça login ou crie uma conta para assinar um plano.</p>
              </div>
              <Link to="/auth">
                <Button>Entrar / Criar conta</Button>
              </Link>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {user && !stripeConfigured && isAdmin && (
          <Alert variant="warning" className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Configuração do Stripe Necessária</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mb-2">A chave API do Stripe não foi configurada. Como administrador, você precisa:</p>
              <ol className="list-decimal ml-5 mb-3 space-y-1">
                <li>Adicionar a chave secreta do Stripe nas configurações do sistema</li>
                <li>Criar produtos e preços no dashboard do Stripe</li>
                <li>Sincronizar os planos de assinatura com os produtos do Stripe</li>
              </ol>
              <div className="mt-3">
                <Link to="/settings">
                  <Button variant="secondary" size="sm" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Ir para Configurações
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {user && !stripeConfigured && !isAdmin && (
          <Alert variant="warning" className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Sistema de Pagamentos Indisponível</AlertTitle>
            <AlertDescription className="text-amber-700">
              O sistema de pagamentos ainda não foi configurado. Por favor, tente novamente mais tarde ou entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        )}
        
        {user && stripeConfigured && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CircleCheck className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Sistema de Pagamentos Configurado</AlertTitle>
            <AlertDescription className="text-green-700">
              O sistema de pagamentos está configurado e pronto para uso. Escolha um plano abaixo para assinar.
            </AlertDescription>
          </Alert>
        )}
        
        <SubscriptionPlanSelector onError={handleError} />
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
