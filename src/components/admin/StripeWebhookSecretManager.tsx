
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye, EyeOff, Save, Check, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const StripeWebhookSecretManager = () => {
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSystem = async () => {
      setInitializing(true);
      setError(null);
      try {
        console.log("Initializing system configurations...");
        
        // First ensure the system_configurations table exists
        const { data: initData, error: initError } = await supabase.functions.invoke('create-system-configurations');
        
        if (initError) {
          console.error('Error initializing system configurations:', initError);
          setError(`Erro ao inicializar configurações: ${initError.message}`);
          toast({
            title: 'Erro',
            description: 'Não foi possível inicializar as configurações do sistema',
            variant: 'destructive',
          });
          return;
        }
        
        console.log("System configurations initialized:", initData);
        
        if (!initData?.success) {
          const errorMsg = initData?.message || 'Resposta inválida do servidor';
          console.error('Error in initialization response:', errorMsg);
          setError(`Erro na resposta do servidor: ${errorMsg}`);
          toast({
            title: 'Erro',
            description: 'Inicialização do sistema retornou um erro',
            variant: 'destructive',
          });
          return;
        }
        
        // Then get the webhook secret
        const { data, error } = await supabase
          .from('system_configurations')
          .select('value')
          .eq('key', 'stripe_webhook_secret')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching Stripe webhook secret:', error);
          setError(`Erro ao buscar segredo do webhook: ${error.message || error.code}`);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar o segredo do webhook do Stripe',
            variant: 'destructive',
          });
          return;
        }

        if (data && data.value) {
          setWebhookSecret(data.value);
          console.log("Webhook secret loaded successfully");
        } else {
          console.log("No webhook secret found");
        }
      } catch (error) {
        const errorMsg = error.message || 'Erro desconhecido';
        console.error('Error in initialization process:', error);
        setError(`Erro no processo de inicialização: ${errorMsg}`);
        toast({
          title: 'Erro',
          description: `Falha ao carregar o segredo do webhook do Stripe: ${errorMsg}`,
          variant: 'destructive',
        });
      } finally {
        setInitializing(false);
      }
    };

    initializeSystem();
  }, [toast]);

  const handleSaveWebhookSecret = async () => {
    if (!webhookSecret.trim()) {
      toast({
        title: 'Erro',
        description: 'O segredo do webhook não pode estar vazio',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting to save webhook secret...");
      
      // First verify if the system_configurations table exists
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('create-system-configurations');
      
      if (verifyError || !verifyData?.success) {
        const errorMsg = verifyError?.message || verifyData?.message || 'Erro desconhecido';
        console.error("Error verifying table:", errorMsg);
        throw new Error(`Não foi possível verificar a tabela: ${errorMsg}`);
      }
      
      // Check if key already exists
      const { data, error: fetchError } = await supabase
        .from('system_configurations')
        .select('id')
        .eq('key', 'stripe_webhook_secret')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error checking if key exists:", fetchError);
        throw new Error(`Erro ao verificar se a chave existe: ${fetchError.message}`);
      }

      // Log user role to check permissions
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user data:", userError);
      } else {
        console.log("Current user:", userData?.user?.id);
        
        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', userData?.user?.id)
          .single();
          
        if (profileError) {
          console.error("Error checking user profile:", profileError);
        } else {
          console.log("User is admin:", profileData?.is_admin);
          if (!profileData?.is_admin) {
            throw new Error("Você não tem permissões de administrador para salvar esta configuração");
          }
        }
      }

      let saveError;
      
      if (data) {
        // Update existing key
        console.log("Updating existing webhook secret...");
        const { error } = await supabase
          .from('system_configurations')
          .update({ value: webhookSecret.trim() })
          .eq('key', 'stripe_webhook_secret');
        saveError = error;
        
        if (error) {
          console.error("Update error details:", error);
        } else {
          console.log("Update completed without error");
        }
      } else {
        // Insert new key
        console.log("Inserting new webhook secret...");
        const { error } = await supabase
          .from('system_configurations')
          .insert({ key: 'stripe_webhook_secret', value: webhookSecret.trim() });
        saveError = error;
        
        if (error) {
          console.error("Insert error details:", error);
        } else {
          console.log("Insert completed without error");
        }
      }

      if (saveError) {
        console.error("Error saving webhook secret:", saveError);
        throw new Error(`Erro ao salvar segredo do webhook: ${saveError.message || saveError.code}`);
      }

      // Verify the save was successful
      const { data: verifyInsertData, error: verifyInsertError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'stripe_webhook_secret')
        .single();
        
      if (verifyInsertError) {
        console.error("Error verifying save:", verifyInsertError);
        throw new Error(`Erro ao verificar se o segredo foi salvo: ${verifyInsertError.message}`);
      }
      
      if (verifyInsertData.value !== webhookSecret.trim()) {
        console.error("Saved value doesn't match:", { saved: verifyInsertData.value, expected: webhookSecret.trim() });
        throw new Error("O valor salvo não corresponde ao valor esperado");
      }

      console.log("Webhook secret saved and verified successfully");
      toast({
        title: 'Sucesso',
        description: 'Segredo do webhook do Stripe salvo com sucesso',
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      const errorMsg = error.message || 'Erro desconhecido';
      console.error('Error saving Stripe webhook secret:', error);
      setError(errorMsg);
      toast({
        title: 'Erro',
        description: `Falha ao salvar o segredo do webhook do Stripe: ${errorMsg}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowSecret = () => {
    setShowSecret(!showSecret);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Webhook do Stripe</CardTitle>
        <CardDescription>
          Configure o segredo do webhook do Stripe para verificar eventos recebidos.
          Isto é necessário para processamento seguro de eventos como pagamentos e atualizações de assinatura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {initializing ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Inicializando...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="webhook-secret" className="text-sm font-medium">
                Segredo do Webhook do Stripe (STRIPE_WEBHOOK_SECRET)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="webhook-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="whsec_..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleShowSecret}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O segredo do webhook começa com "whsec_" e é encontrado nas configurações de webhook do painel do Stripe.
              </p>
            </div>
            
            <div className="mt-4 text-sm">
              <p className="font-medium mb-2">Como configurar o webhook:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse o <a href="https://dashboard.stripe.com/webhooks" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Painel de Webhooks do Stripe</a></li>
                <li>Clique em "Adicionar endpoint"</li>
                <li>Adicione o URL do seu endpoint: <code className="bg-gray-100 px-1 py-0.5 rounded">{window.location.origin}/functions/stripe-webhook</code></li>
                <li>Escolha os eventos relevantes (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)</li>
                <li>Após criar, copie o "Signing Secret" e cole aqui</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline">
          <a 
            href="https://dashboard.stripe.com/webhooks" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Dashboard de Webhooks
          </a>
        </Button>
        <Button
          onClick={handleSaveWebhookSecret}
          disabled={loading || !webhookSecret || initializing}
          className="flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              <span>Salvo</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Salvar</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StripeWebhookSecretManager;
