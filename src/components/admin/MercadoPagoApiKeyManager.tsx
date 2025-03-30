
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Copy, EyeIcon, EyeOffIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const MercadoPagoApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current API key
  const { data, isLoading, error } = useQuery({
    queryKey: ['mercadopago-api-key'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'mercadopago_access_token')
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, which is fine for a new setup
          return { value: '' };
        }
        throw error;
      }
      
      return data;
    }
  });

  useEffect(() => {
    if (data && data.value) {
      setApiKey(data.value);
    }
  }, [data]);

  // Save API key
  const saveApiKey = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      
      try {
        const { data: existingRecord, error: checkError } = await supabase
          .from('system_configurations')
          .select('id')
          .eq('key', 'mercadopago_access_token')
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (existingRecord) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('system_configurations')
            .update({ value: apiKey })
            .eq('key', 'mercadopago_access_token');
            
          if (updateError) throw updateError;
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('system_configurations')
            .insert({ key: 'mercadopago_access_token', value: apiKey });
            
          if (insertError) throw insertError;
        }
        
        return { success: true };
      } finally {
        setIsSaving(false);
      }
    },
    onSuccess: () => {
      toast.success('Chave de API do Mercado Pago salva com sucesso');
      queryClient.invalidateQueries({ queryKey: ['mercadopago-api-key'] });
      setIsRevealed(false);
    },
    onError: (error) => {
      console.error('Error saving Mercado Pago API key:', error);
      toast.error('Erro ao salvar chave de API do Mercado Pago');
    }
  });

  const handleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('Chave de API copiada para a área de transferência');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Configuração do Mercado Pago</CardTitle>
        <CardDescription>
          Configure sua chave de acesso para integração com o Mercado Pago.
          <a 
            href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline block mt-1"
          >
            Saiba como obter suas credenciais
          </a>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mercadopago-api-key">Access Token do Mercado Pago</Label>
              <div className="flex">
                <Input
                  id="mercadopago-api-key"
                  type={isRevealed ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="APP_USR-0000000000000000-000000-00000000000000000000000000000000-000000000"
                  className="flex-grow"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleReveal}
                  className="ml-2"
                >
                  {isRevealed ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
                {apiKey && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="ml-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {isLoading && <p className="text-sm text-muted-foreground">Carregando configuração...</p>}
              {error && (
                <div className="flex items-center text-destructive text-sm mt-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Erro ao carregar configuração
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>Salvando</>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default MercadoPagoApiKeyManager;
