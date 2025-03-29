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
        
        // Check if system_configurations table exists
        const { data: tableExists, error: tableCheckError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'system_configurations');
          
        // If table doesn't exist, create it
        if (tableCheckError || !tableExists || tableExists.length === 0) {
          console.log("system_configurations table doesn't exist, creating...");
          const createQuery = `
            CREATE TABLE IF NOT EXISTS public.system_configurations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              key TEXT NOT NULL UNIQUE,
              value TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            -- Create updated_at trigger
            CREATE OR REPLACE FUNCTION update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            DROP TRIGGER IF EXISTS update_system_configurations_timestamp ON public.system_configurations;
            
            CREATE TRIGGER update_system_configurations_timestamp
            BEFORE UPDATE ON public.system_configurations
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
            
            -- Add RLS policies for admin access
            ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Admin users can do all operations" ON public.system_configurations;
            CREATE POLICY "Admin users can do all operations" 
            ON public.system_configurations
            USING (
              EXISTS (
                SELECT 1 FROM user_profiles
                WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
              )
            );
            
            -- Add policy for reading non-sensitive configurations
            DROP POLICY IF EXISTS "Allow reading non-sensitive configurations" ON public.system_configurations;
            CREATE POLICY "Allow reading non-sensitive configurations" 
            ON public.system_configurations
            FOR SELECT
            USING (
              key NOT IN ('stripe_api_key', 'stripe_webhook_secret', 'openai_api_key')
            );
          `;
          
          try {
            // Try using RPC function if available
            const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: createQuery });
            
            if (rpcError) {
              console.error("Error creating system_configurations table with RPC:", rpcError);
              toast({
                title: 'Aviso',
                description: 'Não foi possível criar a tabela de configurações automaticamente. Por favor, execute o script SQL no painel do Supabase.',
                variant: 'destructive',
              });
              setError('A tabela de configurações não existe. Você precisa criar manualmente no painel do Supabase.');
            } else {
              console.log("system_configurations table created successfully");
            }
          } catch (sqlError) {
            console.error("Error executing table creation:", sqlError);
            toast({
              title: 'Aviso',
              description: 'Não foi possível criar a tabela de configurações automaticamente. Por favor, execute o script SQL no painel do Supabase.',
              variant: 'destructive',
            });
            setError('A tabela de configurações não existe. Você precisa criar manualmente no painel do Supabase.');
          }
        }
        
        // Try to get the webhook secret regardless if we could create the table or not
        try {
          const { data, error } = await supabase
            .from('system_configurations')
            .select('value')
            .eq('key', 'stripe_webhook_secret')
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching Stripe webhook secret:', error);
            setError(`Erro ao buscar segredo do webhook: ${error.message || error.code}`);
          } else if (data && data.value) {
            setWebhookSecret(data.value);
            console.log("Webhook secret loaded successfully");
          } else {
            console.log("No webhook secret found");
          }
        } catch (fetchError) {
          console.error('Error fetching webhook secret:', fetchError);
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
      
      // Check if user is admin
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error getting user data:", userError);
        throw new Error(`Erro ao obter dados do usuário: ${userError.message}`);
      }
      
      // Check if user is admin
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userData?.user?.id)
        .single();
        
      if (profileError) {
        console.error("Error checking user profile:", profileError);
        throw new Error(`Erro ao verificar perfil do usuário: ${profileError.message}`);
      }
      
      if (!profileData?.is_admin) {
        throw new Error("Você não tem permissões de administrador para salvar esta configuração");
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
