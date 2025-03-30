
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Copy, EyeIcon, EyeOffIcon, Link } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MercadoPagoApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['mercadopago-config'],
    queryFn: async () => {
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'mercadopago_access_token')
        .single();
        
      const { data: webhookData, error: webhookError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'mercadopago_webhook_url')
        .single();
        
      if (apiKeyError && apiKeyError.code !== 'PGRST116') {
        throw apiKeyError;
      }
      
      return { 
        apiKey: apiKeyData?.value || '',
        webhookUrl: webhookData?.value || ''
      };
    }
  });

  useEffect(() => {
    if (data) {
      setApiKey(data.apiKey);
      setWebhookUrl(data.webhookUrl);
    }
  }, [data]);

  const saveConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const { data: existingRecord, error: checkError } = await supabase
        .from('system_configurations')
        .select('id')
        .eq('key', key)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingRecord) {
        const { error: updateError } = await supabase
          .from('system_configurations')
          .update({ value })
          .eq('key', key);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('system_configurations')
          .insert({ key, value });
          
        if (insertError) throw insertError;
      }
      
      return { key, value };
    },
    onSuccess: (data) => {
      const configName = data.key === 'mercadopago_access_token' ? 'API key' : 'Webhook URL';
      toast.success(`Mercado Pago ${configName} saved successfully`);
      queryClient.invalidateQueries({ queryKey: ['mercadopago-config'] });
      if (data.key === 'mercadopago_access_token') {
        setIsRevealed(false);
      }
    },
    onError: (error, variables) => {
      console.error(`Error saving Mercado Pago ${variables.key}:`, error);
      toast.error(`Error saving Mercado Pago configuration`);
    }
  });

  const handleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig.mutate({ key: 'mercadopago_access_token', value: apiKey });
  };

  const handleSaveWebhookUrl = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig.mutate({ key: 'mercadopago_webhook_url', value: webhookUrl });
  };

  const generateWebhookUrl = () => {
    // Use the dedicated Mercado Pago webhook endpoint
    const webhookUrl = "https://znumbovtprdnfddwwerf.supabase.co/functions/v1/mercadopago-webhook";
    setWebhookUrl(webhookUrl);
    toast.success("Webhook URL generated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Configuração do Mercado Pago</CardTitle>
        <CardDescription>
          Configure sua integração com o Mercado Pago.
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
      <CardContent>
        <Tabs defaultValue="api-key">
          <TabsList className="mb-4">
            <TabsTrigger value="api-key">API Key</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="help">Ajuda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-key">
            <form onSubmit={handleSaveApiKey}>
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
                        onClick={() => handleCopy(apiKey, "API Key")}
                        className="ml-2"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Insira o Access Token de produção, que começa com "APP_USR-". 
                    <span className="text-yellow-600">Não use Access Token de teste.</span>
                  </p>
                  {isLoading && <p className="text-sm text-muted-foreground">Carregando configuração...</p>}
                  {error && (
                    <div className="flex items-center text-destructive text-sm mt-2">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Erro ao carregar configuração
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={saveConfig.isPending}>
                  {saveConfig.isPending && saveConfig.variables?.key === 'mercadopago_access_token' ? (
                    <>Salvando</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Salvar API Key
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="webhook">
            <form onSubmit={handleSaveWebhookUrl}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mercadopago-webhook-url">URL de Webhook</Label>
                  <div className="flex">
                    <Input
                      id="mercadopago-webhook-url"
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://seu-projeto.supabase.co/functions/v1/mercadopago-webhook"
                      className="flex-grow"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(webhookUrl, "Webhook URL")}
                      className="ml-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateWebhookUrl}
                    className="mt-2"
                  >
                    <Link className="mr-2 h-4 w-4" />
                    Gerar URL automática
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use esta URL para configurar webhooks no painel do Mercado Pago. 
                    Isto permitirá processamento automático de pagamentos.
                  </p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Ao configurar seu webhook no Mercado Pago, 
                      acesse Seu Negócio &gt; Configurações &gt; Webhooks e defina o método HTTP como POST.
                      Você <strong>não precisa</strong> enviar tokens de autenticação - a edge function aceita 
                      chamadas sem autenticação vindas do Mercado Pago.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Testando o webhook:</strong> No painel do Mercado Pago, após configurar o webhook,
                      clique em "Testar endpoint" para verificar a conexão. O sistema deve retornar "Test webhook received successfully".
                      Este teste confirma que o webhook está acessível pelo Mercado Pago.
                    </p>
                  </div>
                </div>
                <Button type="submit" disabled={saveConfig.isPending}>
                  {saveConfig.isPending && saveConfig.variables?.key === 'mercadopago_webhook_url' ? (
                    <>Salvando</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Salvar URL de Webhook
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="help">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Passos para configurar o Mercado Pago:</h3>
                <ol className="list-decimal pl-5 text-sm text-blue-800 space-y-2">
                  <li>Acesse sua conta do <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noreferrer" className="underline">Mercado Pago Developers</a>.</li>
                  <li>Vá para "Suas integrações" e crie uma nova aplicação ou use uma existente.</li>
                  <li>Nas credenciais de produção, copie o <strong>Access Token</strong> (começa com APP_USR-).</li>
                  <li>Cole o Access Token no campo API Key acima e salve.</li>
                  <li>Gere a URL de webhook automática clicando no botão na aba Webhook.</li>
                  <li>No painel do Mercado Pago, acesse Seu Negócio &gt; Configurações &gt; Webhooks.</li>
                  <li>Adicione a URL de webhook gerada e selecione todos os eventos de pagamento.</li>
                  <li>Defina o método HTTP como POST.</li>
                  <li>Após salvar, clique em "Testar endpoint" para verificar a conexão.</li>
                </ol>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-md mt-4">
                <h3 className="font-medium text-amber-800 mb-2">Resolução de Problemas:</h3>
                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-2">
                  <li>Certifique-se de estar usando o <strong>Access Token de produção</strong>, não o token de teste.</li>
                  <li>Verifique se todas as permissões estão habilitadas para sua aplicação no Mercado Pago.</li>
                  <li>Se receber erros de autenticação ao testar o webhook, não se preocupe com autenticação - nossa implementação não requer tokens de autenticação.</li>
                  <li>Certifique-se de selecionar o método HTTP como POST, não GET.</li>
                  <li>Após configurar o webhook, teste usando o botão "Testar endpoint" no painel do Mercado Pago.</li>
                  <li>Se os pagamentos não estão sendo processados, verifique os logs do Supabase Edge Functions.</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Configure estas opções para permitir pagamentos via Mercado Pago. 
          Os usuários poderão realizar pagamentos via cartão de crédito, boleto ou Pix.
        </p>
      </CardFooter>
    </Card>
  );
};

export default MercadoPagoApiKeyManager;
