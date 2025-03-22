
import React, { useState } from "react";
import { makeUserAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const AdminUtils = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleMakeUserAdmin = async () => {
    if (!email) {
      setError("Por favor, informe um email válido");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    toast({
      title: "Processando...",
      description: `Tentando fazer ${email} administrador.`,
    });
    
    try {
      console.log('Admin Utils - making user admin:', email);
      await makeUserAdmin(email);
      
      setSuccess(`${email} agora é um administrador.`);
      toast({
        title: "Sucesso!",
        description: `${email} agora é um administrador.`,
      });
    } catch (error: any) {
      console.error('Error making user admin:', error);
      setError(error.message || "Erro ao tornar usuário administrador.");
      toast({
        title: "Erro!",
        description: error.message || "Erro ao tornar usuário administrador.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Utilities</CardTitle>
        <CardDescription>
          Make a user an administrator
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="User email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleMakeUserAdmin} disabled={loading}>
            {loading ? "Processing..." : "Make Admin"}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        This action will give the user full administrative privileges.
      </CardFooter>
    </Card>
  );
};
