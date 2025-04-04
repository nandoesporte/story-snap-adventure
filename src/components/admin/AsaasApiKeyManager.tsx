
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Copy, EyeIcon, EyeOffIcon, Link, InfoIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AsaasApiKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [environment, setEnvironment] = useState('sandbox'); // sandbox or production
  const [isRevealed, setIsRevealed] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['asaas-config'],
    queryFn: async () => {
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'asaas_api_key')
        .single();
        
      const { data: webhookData, error: webhookError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'asaas_webhook_url')
        .single();
        
      const { data: envData, error: envError } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'asaas_environment')
        .single();
        
      if (apiKeyError && apiKeyError.code !== 'PGRST116') {
        throw apiKeyError;
      }
      
      return { 
        apiKey: apiKeyData?.value || '',
        webhookUrl: webhookData?.value || '',
        environment: envData?.value || 'sandbox'
      };
    }
  });

  useEffect(() => {
    if (data) {
      setApiKey(data.apiKey);
      setWebhookUrl(data.webhookUrl);
      setEnvironment(data.environment);
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
      let configName = '';
      
      if (data.key === 'asaas_api_key') configName = 'API key';
      else if (data.key === 'asaas_webhook_url') configName = 'Webhook URL';
      else if (data.key === 'asaas_environment') configName = 'Ambiente';
      
      toast.success(`Asaas ${configName} salvo com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['asaas-config'] });
      
      if (data.key === 'asaas_api_key') {
        setIsRevealed(false);
      }
    },
    onError: (error, variables) => {
      console.error(`Error saving Asaas ${variables.key}:`, error);
      toast.error(`Erro ao salvar configuração do Asaas`);
    }
  });

  const handleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência`);
  };

  // Updated API key format validation according to Asaas documentation
  const validateApiKeyFormat = (key: string, env: string): boolean => {
    if (!key.trim()) return true; // Chave vazia é válida (para limpar a chave)
    
    // Aceitar todos os formatos de chave Asaas conforme documentação
    const validPrefix = key.startsWith('$aact_');
    
    if (!validPrefix) {
      return false;
    }
    
    // For sandbox environment, check for sandbox or homologation indicators
    if (env === 'sandbox') {
      // In sandbox, we accept both regular sandbox keys and homologation keys
      return true;
    } else if (env === 'production') {
      // In production, all $aact_ keys are valid
      return true;
    }
    
    return true;
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip validation if empty (to allow clearing the key)
    if (!apiKey.trim()) {
      saveConfig.mutate({ key: 'asaas_api_key', value: '' });
      return;
    }
    
    // Validate API key format according to Asaas docs
    const isValid = validateApiKeyFormat(apiKey, environment);
    
    if (!isValid) {
      toast.error('Formato de chave API inválido. A chave deve começar com $aact_');
      return;
    }
    
    // Save the API key
    saveConfig.mutate({ key: 'asaas_api_key', value: apiKey });
  };

  const handleSaveWebhookUrl = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig.mutate({ key: 'asaas_webhook_url', value: webhookUrl });
  };

  const handleSaveEnvironment = (value: string) => {
    // If changing environment, warn about API key compatibility
    if (value !== environment && apiKey) {
      const isKeyValid = validateApiKeyFormat(apiKey, value);
      if (!isKeyValid) {
        if (value === 'sandbox') {
          toast.warning('Ambiente alterado para Sandbox. Você pode precisar atualizar sua chave API.');
        } else {
          toast.warning('Ambiente alterado para Produção. Você pode precisar atualizar sua chave API.');
        }
      }
    }
    
    saveConfig.mutate({ key: 'asaas_environment', value });
    setEnvironment(value); // Update local state immediately to show correct validation
  };

  const generateWebhookUrl = () => {
    const webhookUrl = "https://znumbovtprdnfddwwerf.supabase.co/functions/v1/asaas-webhook";
    setWebhookUrl(webhookUrl);
    toast.success("URL de Webhook gerada");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Configuração do Asaas</CardTitle>
        <CardDescription>
          Configure sua integração com o Asaas.
          <a 
            href="https://docs.asaas.com/docs/obtendo-sua-chave-de-api"
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
            <TabsTrigger value="environment">Ambiente</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="help">Ajuda</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-key">
            <form onSubmit={handleSaveApiKey}>
              <div className="space-y-4">
                <Alert className="bg-amber-50 border-amber-200 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>Importante:</strong> A chave API do Asaas deve começar com <code className="bg-amber-100 px-1 rounded">$aact_</code> e pode ser obtida no painel do Asaas em Configurações &gt; Integrações &gt; API.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="asaas-api-key">API Key do Asaas</Label>
                  <div className="flex">
                    <Input
                      id="asaas-api-key"
                      type={isRevealed ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="$aact_..."
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
                    Insira a API Key do Asaas, que deve começar com "$aact_". 
                    A chave pode ser obtida no painel do Asaas em Configurações &gt; Integrações &gt; API.
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
                  {saveConfig.isPending && saveConfig.variables?.key === 'asaas_api_key' ? (
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

          <TabsContent value="environment">
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200 mb-4">
                <InfoIcon className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  O ambiente selecionado deve corresponder ao tipo de chave API que você está usando.
                  Se mudar o ambiente, certifique-se de atualizar também sua chave API.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="asaas-environment">Ambiente</Label>
                <Select
                  value={environment}
                  onValueChange={(value) => {
                    handleSaveEnvironment(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o ambiente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  Ambiente de Sandbox para testes ou Produção para pagamentos reais.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="webhook">
            <form onSubmit={handleSaveWebhookUrl}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="asaas-webhook-url">URL de Webhook</Label>
                  <div className="flex">
                    <Input
                      id="asaas-webhook-url"
                      type="text"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://seu-projeto.supabase.co/functions/v1/asaas-webhook"
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
                    Use esta URL para configurar webhooks no painel do Asaas.
                    Isto permitirá processamento automático de pagamentos.
                  </p>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Ao configurar seu webhook no Asaas, 
                      acesse Integrações &gt; Notificações e adicione esta URL como destino.
                      Configure o webhook para receber os eventos relacionados a pagamentos.
                    </p>
                  </div>
                </div>
                <Button type="submit" disabled={saveConfig.isPending}>
                  {saveConfig.isPending && saveConfig.variables?.key === 'asaas_webhook_url' ? (
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
                <h3 className="font-medium text-blue-800 mb-2">Passos para configurar o Asaas:</h3>
                <ol className="list-decimal pl-5 text-sm text-blue-800 space-y-2">
                  <li>Acesse sua conta do <a href="https://www.asaas.com" target="_blank" rel="noreferrer" className="underline">Asaas</a>.</li>
                  <li>No painel administrativo, vá para Configurações &gt; Integrações &gt; API.</li>
                  <li>Copie sua API Key, que deve começar com <code className="bg-blue-100 px-1 rounded">$aact_</code></li>
                  <li>Selecione o ambiente correto (Sandbox para testes ou Produção).</li>
                  <li>Cole a API Key no campo acima e salve.</li>
                  <li>Gere a URL de webhook automática clicando no botão na aba Webhook.</li>
                  <li>No painel do Asaas, acesse Integrações &gt; Notificações.</li>
                  <li>Adicione a URL de webhook gerada e selecione os eventos de pagamento relevantes.</li>
                </ol>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-md mt-4">
                <h3 className="font-medium text-amber-800 mb-2">Resolução de Problemas:</h3>
                <ul className="list-disc pl-5 text-sm text-amber-800 space-y-2">
                  <li><strong>Formato de chave API inválido:</strong> Verifique se a chave começa com o prefixo correto <code className="bg-amber-100 px-1 rounded">$aact_</code>.</li>
                  <li><strong>API key inválida:</strong> Certifique-se de que a chave está ativa e não expirou.</li>
                  <li><strong>Erro de permissão:</strong> Verifique se a chave tem as permissões necessárias na sua conta Asaas.</li>
                  <li>Após configurar o webhook, teste uma compra para verificar se as notificações estão sendo recebidas.</li>
                  <li>Se os pagamentos não estão sendo processados, verifique os logs do Supabase Edge Functions.</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-md mt-4">
                <h3 className="font-medium text-green-800 mb-2">Exemplos de chaves API do Asaas:</h3>
                <ul className="list-disc pl-5 text-sm text-green-800 space-y-1">
                  <li>Chave de produção: <code className="bg-green-100 px-1 rounded">$aact_YourApiKeyHere</code></li>
                  <li>Chave de homologação: <code className="bg-green-100 px-1 rounded">$aact_hmlg_YourApiKeyHere</code></li>
                  <li>Chave de sandbox: <code className="bg-green-100 px-1 rounded">$aact_sandbox_YourApiKeyHere</code></li>
                </ul>
                <p className="text-sm text-green-800 mt-2">
                  De acordo com a <a href="https://docs.asaas.com/reference/criar-novo-cliente" target="_blank" rel="noreferrer" className="underline">documentação oficial do Asaas</a>, 
                  a chave API é enviada no cabeçalho HTTP <code className="bg-green-100 px-1 rounded">access_token</code>.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Configure estas opções para permitir pagamentos via Asaas. 
          Os usuários poderão realizar pagamentos via cartão de crédito, boleto ou Pix.
        </p>
      </CardFooter>
    </Card>
  );
};

export default AsaasApiKeyManager;
