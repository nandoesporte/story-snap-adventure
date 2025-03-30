
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader, Store } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  icon: React.ReactNode;
}

const PaymentMethodsManager = () => {
  const queryClient = useQueryClient();
  
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
  const { data: configurations, isLoading } = useQuery({
    queryKey: ['payment-methods-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('key, value')
        .in('key', ['mercadopago_enabled']);
        
      if (error) {
        console.error('Error fetching payment methods config:', error);
        throw error;
      }
      
      const config = {};
      data.forEach(item => {
        config[item.key] = item.value === 'true';
      });
      
      return config;
    }
  });

  // Update payment methods state with fetched data
  const methods = paymentMethods.map(method => ({
    ...method,
    is_active: configurations?.[method.key] ?? false
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
        <CardTitle className="text-xl">Métodos de Pagamento</CardTitle>
        <CardDescription>
          Ative ou desative os métodos de pagamento disponíveis para seus clientes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((method) => (
              <div key={method.id} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  {method.icon}
                  <Label htmlFor={`toggle-${method.id}`} className="cursor-pointer">
                    {method.name}
                  </Label>
                </div>
                <Switch
                  id={`toggle-${method.id}`}
                  checked={method.is_active}
                  onCheckedChange={() => handleToggle(method.key, method.is_active)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsManager;
