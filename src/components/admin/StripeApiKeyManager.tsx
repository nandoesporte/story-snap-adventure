
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
import { Eye, EyeOff, Save, Check, Loader2 } from 'lucide-react';

const StripeApiKeyManager = () => {
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeSystem = async () => {
      setInitializing(true);
      try {
        // First ensure the system_configurations table exists
        const { error: initError } = await supabase.functions.invoke('create-system-configurations');
        
        if (initError) {
          console.error('Error initializing system configurations:', initError);
          toast({
            title: 'Erro',
            description: 'Não foi possível inicializar as configurações do sistema',
            variant: 'destructive',
          });
          return;
        }
        
        // Then get the Stripe API key
        const { data, error } = await supabase
          .from('system_configurations')
          .select('value')
          .eq('key', 'stripe_api_key')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching Stripe API Key:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível carregar a chave da API do Stripe',
            variant: 'destructive',
          });
          return;
        }

        if (data && data.value) {
          setStripeApiKey(data.value);
        }
      } catch (error) {
        console.error('Error fetching Stripe API Key:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar a chave da API do Stripe',
          variant: 'destructive',
        });
      } finally {
        setInitializing(false);
      }
    };

    initializeSystem();
  }, [toast]);

  const handleSaveApiKey = async () => {
    setLoading(true);
    try {
      // Check if key already exists
      const { data, error: fetchError } = await supabase
        .from('system_configurations')
        .select('id')
        .eq('key', 'stripe_api_key')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let saveError;
      
      if (data) {
        // Update existing key
        const { error } = await supabase
          .from('system_configurations')
          .update({ value: stripeApiKey })
          .eq('key', 'stripe_api_key');
        saveError = error;
      } else {
        // Insert new key
        const { error } = await supabase
          .from('system_configurations')
          .insert({ key: 'stripe_api_key', value: stripeApiKey });
        saveError = error;
      }

      if (saveError) {
        throw saveError;
      }

      toast({
        title: 'Sucesso',
        description: 'Chave de API do Stripe salva com sucesso',
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving Stripe API Key:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar a chave de API do Stripe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da API do Stripe</CardTitle>
        <CardDescription>
          Configure a chave secreta da API do Stripe para processar pagamentos. 
          Esta chave será usada nas funções de borda para comunicação com o Stripe.
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
            <div className="space-y-2">
              <label htmlFor="stripe-api-key" className="text-sm font-medium">
                Chave secreta da API do Stripe (STRIPE_SECRET_KEY)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Input
                    id="stripe-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={stripeApiKey}
                    onChange={(e) => setStripeApiKey(e.target.value)}
                    placeholder="sk_test_..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleShowApiKey}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                A chave secreta começa com "sk_test_" para ambiente de teste ou "sk_live_" para produção.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSaveApiKey}
          disabled={loading || !stripeApiKey || initializing}
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

export default StripeApiKeyManager;
