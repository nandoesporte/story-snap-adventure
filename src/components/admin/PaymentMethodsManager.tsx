
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader, Store, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentMethod {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  icon: React.ReactNode;
}

const PaymentMethodsManager = () => {
  const queryClient = useQueryClient();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Modified to only include Mercado Pago
  const paymentMethods: PaymentMethod[] = [
    { 
      id: 'mercadopago', 
      name: 'Mercado Pago', 
      key: 'mercadopago_enabled',
      is_active: false,
      icon: <Store className="h-5 w-5 mr-2" />
    }
  ];

  // Fetch payment methods configuration
  const { data: configurations, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-methods-config'],
    queryFn: async () => {
      // First check if enable flag exists
      const { data: enabledData, error: enabledError } = await supabase
        .from('system_configurations')
        .select('key, value')
        .in('key', ['mercadopago_enabled']);
      
      if (enabledError) {
        console.error('Error fetching payment methods enabled flags:', enabledError);
        throw enabledError;
      }
      
      // Then check if API key exists
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('system_configurations')
        .select('key, value')
        .in('key', ['mercadopago_access_token']);
      
      if (apiKeyError) {
        console.error('Error fetching payment methods API keys:', apiKeyError);
        throw apiKeyError;
      }
      
      const config = {};
      enabledData.forEach(item => {
        config[item.key] = item.value === 'true';
      });
      
      // Include API key information
      const apiKeyInfo = {};
      apiKeyData.forEach(item => {
        const hasApiKey = item.value && item.value.trim() !== '';
        const keyName = item.key.replace('_access_token', '_has_api_key');
        apiKeyInfo[keyName] = hasApiKey;
      });
      
      console.log('Payment configuration:', { enableFlags: config, apiKeyInfo });
      
      return { ...config, ...apiKeyInfo };
    }
  });

  // Update payment methods state with fetched data
  const methods = paymentMethods.map(method => ({
    ...method,
    is_active: configurations?.[method.key] ?? false,
    has_api_key: configurations?.[method.id + '_has_api_key'] ?? false
  }));

  // Toggle payment method
  const toggleMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: boolean }) => {
      const { data: existingRecord, error: checkError } = await supabase
        .from('system_configurations')
        .select('id')
        .eq('key', key)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('system_configurations')
          .update({ value: String(value) })
          .eq('key', key);
          
        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('system_configurations')
          .insert({ key, value: String(value) });
          
        if (insertError) throw insertError;
      }
      
      return { key, value };
    },
    onSuccess: (data) => {
      const methodName = paymentMethods.find(m => m.key === data.key)?.name;
      toast.success(`${methodName} ${data.value ? 'ativado' : 'desativado'} com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['payment-methods-config'] });
    },
    onError: (error) => {
      console.error('Error toggling payment method:', error);
      toast.error('Erro ao alterar configuração do método de pagamento');
    }
  });

  const handleToggle = (key: string, currentValue: boolean) => {
    toggleMutation.mutate({ key, value: !currentValue });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Métodos de Pagamento</CardTitle>
            <CardDescription>
              Ative ou desative os métodos de pagamento disponíveis para seus clientes.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <div className="flex items-center">
              <Loader className="h-4 w-4 mr-1" />
              Atualizar
            </div>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar configurações: {error.message}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {methods.map((method) => (
              <div key={method.id}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    {method.icon}
                    <Label htmlFor={`toggle-${method.id}`} className="cursor-pointer">
                      {method.name}
                    </Label>
                    {method.has_api_key ? (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        API Configurada
                      </span>
                    ) : (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                        API não configurada
                      </span>
                    )}
                  </div>
                  <Switch
                    id={`toggle-${method.id}`}
                    checked={method.is_active}
                    onCheckedChange={() => handleToggle(method.key, method.is_active)}
                    disabled={toggleMutation.isPending || !method.has_api_key}
                  />
                </div>
                
                {!method.has_api_key && (
                  <Alert className="mt-2 mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      É necessário configurar a API do {method.name} antes de ativá-lo.
                      Acesse a aba "Pagamentos" e configure a API key.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                {showDebugInfo ? "Ocultar" : "Mostrar"} informações de depuração
              </Button>
              
              {showDebugInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs font-mono">
                  <div>Configuration data:</div>
                  <pre>{JSON.stringify(configurations, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsManager;
