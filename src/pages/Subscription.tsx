
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SubscriptionPlanSelector } from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Subscription = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }
  
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
        <SubscriptionPlanSelector />
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
