
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Shield, Key } from "lucide-react";

export const StripeApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [hasExistingKey, setHasExistingKey] = useState<boolean>(false);
  
  useEffect(() => {
    const checkExistingKey = async () => {
      setIsLoading(true);
      try {
        // Check if the API key exists without retrieving its value
        const { data, error } = await supabase
          .rpc('check_setting_exists', { setting_key: 'stripe_api_key' });
          
        if (error) {
          console.error("Error checking Stripe API key:", error);
          toast.error("Erro ao verificar chave da API do Stripe");
          setHasExistingKey(false);
        } else {
          setHasExistingKey(!!data);
        }
      } catch (error) {
        console.error("Error checking Stripe API key:", error);
        toast.error("Erro ao verificar chave da API do Stripe");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingKey();
  }, []);
  
  const saveApiKey = async () => {
    if (!apiKey) {
      toast.error("Por favor, informe a chave da API");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the upsert operation to either insert or update
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'stripe_api_key',
          value: apiKey,
          description: 'Stripe API Key for payment processing'
        }, {
          onConflict: 'key'
        });
      
      if (error) {
        throw error;
      }
      
      toast.success("Chave da API do Stripe configurada com sucesso!");
      setHasExistingKey(true);
      setApiKey("");
      setShowKey(false);
    } catch (error: any) {
      console.error("Error saving Stripe API key:", error);
      toast.error(`Erro ao salvar a chave da API: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteApiKey = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('settings')
        .delete()
        .eq('key', 'stripe_api_key');
      
      if (error) {
        throw error;
      }
      
      toast.success("Chave da API do Stripe removida com sucesso");
      setHasExistingKey(false);
    } catch (error: any) {
      console.error("Error deleting Stripe API key:", error);
      toast.error(`Erro ao remover a chave da API: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Chave da API do Stripe
        </CardTitle>
        <CardDescription>
          Configure a chave da API do Stripe para processar pagamentos e assinaturas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasExistingKey ? (
            <div className="bg-green-50 p-4 rounded-md flex items-start gap-2">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Chave da API configurada</p>
                <p className="text-green-700 text-sm">
                  A chave da API do Stripe está configurada e pronta para uso.
                  Para trocar a chave, informe uma nova abaixo.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-md flex items-start gap-2">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Chave da API não configurada</p>
                <p className="text-amber-700 text-sm">
                  Configure a chave da API do Stripe para habilitar funcionalidades de pagamento.
                </p>
              </div>
            </div>
          )}
          
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="sk_test_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button
          disabled={!apiKey || isLoading}
          onClick={saveApiKey}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Salvando..." : "Salvar Chave API"}
        </Button>
        
        {hasExistingKey && (
          <Button
            variant="destructive"
            disabled={isLoading}
            onClick={deleteApiKey}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Removendo..." : "Remover Chave"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StripeApiKeyManager;
