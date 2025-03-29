
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export function StripeApiKeyManager() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      setIsChecking(true);
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: `SELECT * FROM system_configurations WHERE key = 'stripe_api_key'` });

        if (error) {
          throw error;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          setApiKey(data[0]?.value || "");
        }
      } catch (error: any) {
        console.error("Error checking API key:", error);
        toast.error(error.message);
      } finally {
        setIsChecking(false);
      }
    };

    checkApiKey();
  }, []);

  const updateApiKey = async () => {
    setIsLoading(true);
    try {
      // Use exec_sql RPC function instead since update_or_insert_setting doesn't exist
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: `
          INSERT INTO system_configurations (key, value)
          VALUES ('stripe_api_key', '${apiKey}')
          ON CONFLICT (key) 
          DO UPDATE SET value = '${apiKey}', updated_at = NOW()
        `
      });

      if (error) {
        throw error;
      }

      toast.success("API Key atualizada com sucesso!");
    } catch (error: any) {
      console.error("Error updating API key:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Chave API do Stripe</CardTitle>
        <CardDescription>
          Insira ou atualize a chave API do Stripe para habilitar os pagamentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">Chave API do Stripe</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_live_..."
            disabled={isChecking}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCopyClick} disabled={isCopied || isChecking} variant="secondary">
            {isCopied ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              "Copiar"
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Cole a chave API no painel do Stripe.
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={updateApiKey} disabled={isLoading || isChecking}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            "Atualizar Chave API"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
