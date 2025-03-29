
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SubscriptionPlanSelector } from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Subscription = () => {
  const { user, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Clear error when component unmounts or user changes
  useEffect(() => {
    setErrorMessage(null);
  }, [user]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Carregando...</p>
      </div>
    );
  }
  
  const handleError = (error: string) => {
    setErrorMessage(error);
    toast.error(error);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        {!user && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-amber-800">Você não está logado</h3>
                <p className="text-amber-700">Faça login ou crie uma conta para assinar um plano.</p>
              </div>
              <Link to="/auth">
                <Button>Entrar / Criar conta</Button>
              </Link>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {user && (
          <Alert variant="warning" className="mb-6 bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Configuração do Stripe</AlertTitle>
            <AlertDescription className="text-amber-700">
              Certifique-se de que a chave API do Stripe foi configurada nas configurações do sistema e que os planos de assinatura possuem IDs de preço do Stripe válidos.
            </AlertDescription>
          </Alert>
        )}
        
        <SubscriptionPlanSelector onError={handleError} />
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
