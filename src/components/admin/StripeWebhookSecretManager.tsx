
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Webhook } from "lucide-react";

export const StripeWebhookSecretManager = () => {
  const [secret, setSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [hasExistingSecret, setHasExistingSecret] = useState<boolean>(false);
  
  useEffect(() => {
    const checkExistingSecret = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: `SELECT * FROM system_configurations WHERE key = 'stripe_webhook_secret'` 
        });
        
        if (error) {
          console.error("Error checking Stripe webhook secret:", error);
          toast.error("Erro ao verificar segredo do webhook do Stripe");
          setHasExistingSecret(false);
        } else {
          // Properly handle the data with correct type casting
          const typedData = data as any[] | null;
          setHasExistingSecret(!!typedData && typedData.length > 0);
        }
      } catch (error) {
        console.error("Error checking Stripe webhook secret:", error);
        toast.error("Erro ao verificar segredo do webhook do Stripe");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingSecret();
  }, []);
  
  const saveWebhookSecret = async () => {
    if (!secret) {
      toast.error("Por favor, informe o segredo do webhook");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'stripe_webhook_secret',
          value: secret
        }, {
          onConflict: 'key'
        });
      
      if (error) {
        throw error;
      }
      
      toast.success("Segredo do webhook do Stripe configurado com sucesso!");
      setHasExistingSecret(true);
      setSecret("");
      setShowSecret(false);
    } catch (error: any) {
      console.error("Error saving Stripe webhook secret:", error);
      toast.error(`Erro ao salvar o segredo do webhook: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteWebhookSecret = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('system_configurations')
        .delete()
        .eq('key', 'stripe_webhook_secret');
      
      if (error) {
        throw error;
      }
      
      toast.success("Segredo do webhook do Stripe removido com sucesso");
      setHasExistingSecret(false);
    } catch (error: any) {
      console.error("Error deleting Stripe webhook secret:", error);
      toast.error(`Erro ao remover o segredo do webhook: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Segredo do Webhook do Stripe
        </CardTitle>
        <CardDescription>
          Configure o segredo do webhook do Stripe para verificar e processar eventos do Stripe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasExistingSecret ? (
            <div className="bg-green-50 p-4 rounded-md flex items-start gap-2">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Segredo do webhook configurado</p>
                <p className="text-green-700 text-sm">
                  O segredo do webhook do Stripe está configurado e pronto para uso.
                  Para trocar o segredo, informe um novo abaixo.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-md flex items-start gap-2">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Segredo do webhook não configurado</p>
                <p className="text-amber-700 text-sm">
                  Configure o segredo do webhook do Stripe para verificar e processar eventos.
                </p>
              </div>
            </div>
          )}
          
          <div className="relative">
            <Input
              type={showSecret ? "text" : "password"}
              placeholder="whsec_..."
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button
          disabled={!secret || isLoading}
          onClick={saveWebhookSecret}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Salvando..." : "Salvar Segredo do Webhook"}
        </Button>
        
        {hasExistingSecret && (
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={deleteWebhookSecret}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Removendo..." : "Remover Segredo"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StripeWebhookSecretManager;
