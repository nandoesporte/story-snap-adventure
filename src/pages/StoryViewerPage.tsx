
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StoryViewer from '@/components/story-viewer/StoryViewer';
import { useStoryData } from '@/components/story-viewer/useStoryData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogIn, CreditCard, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const StoryViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use a more robust error handling approach for the story data
  const { 
    storyData, 
    loading, 
    handleImageError,
    error
  } = useStoryData(id, retryCount);
  
  // Handle retry logic for loading errors
  const handleRetryLoad = useCallback(() => {
    console.log("Tentando carregar a história novamente...");
    setIsRefreshing(true);
    setRetryCount(prev => prev + 1);
    
    // Add a slight delay to allow the UI to update
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, []);
  
  // Force refresh page to fix issues with stuck loading
  const handleForceRefresh = useCallback(() => {
    console.log("Recarregando a página...");
    window.location.reload();
  }, []);
  
  // Redirect to home if there's an error loading the story after multiple retries
  useEffect(() => {
    if (error && retryCount > 3) {
      console.error("Não foi possível carregar a história", "Por favor, tente novamente mais tarde ou escolha outra história.");
      
      // Give user a chance to see the error before redirecting
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [error, retryCount, navigate]);

  // If user is not authenticated, show login notice
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold text-amber-800">Login Necessário</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para ler histórias, você precisa estar conectado à sua conta.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Button variant="outline" onClick={() => navigate("/")} className="border-amber-200 text-amber-800 hover:bg-amber-50">
                    Voltar para Início
                  </Button>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate("/auth")}>
                    Entrar na Conta
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  // If user doesn't have an active subscription, show subscription notice
  if (!isLoadingSubscription && !hasActiveSubscription) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold text-amber-800">Assinatura Necessária</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para ler histórias, você precisa ter uma assinatura ativa.
                </p>
                <div className="flex gap-4 flex-wrap justify-center">
                  <Button variant="outline" onClick={() => navigate("/")} className="border-amber-200 text-amber-800 hover:bg-amber-50">
                    Voltar para Início
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                    onClick={() => navigate("/planos")}
                  >
                    Ver Planos de Assinatura
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {loading || isRefreshing ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-4 border-amber-200 border-dashed animate-spin"></div>
              <div className="absolute inset-2 rounded-full bg-amber-400/50"></div>
            </div>
            <p className="text-amber-800 font-medium">Carregando sua história...</p>
          </div>
        ) : storyData ? (
          <StoryViewer 
            storyId={id}
          />
        ) : (
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-amber-800 mb-4">
              {error ? "Erro ao carregar a história" : "História não encontrada"}
            </h2>
            <p className="text-gray-600 mb-8">
              {error ? "Ocorreu um erro ao carregar esta história." : "Esta história não existe ou foi removida."}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate('/')} variant="outline" className="border-amber-200 text-amber-800 hover:bg-amber-50">
                Voltar para Início
              </Button>
              {error && retryCount < 4 && (
                <Button 
                  variant="default" 
                  onClick={handleRetryLoad}
                  disabled={isRefreshing}
                  className="gap-2 bg-amber-400 hover:bg-amber-500 text-black"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Tentar novamente
                </Button>
              )}
              <Button 
                variant="secondary" 
                onClick={handleForceRefresh}
                className="gap-2 bg-amber-200 hover:bg-amber-300 text-amber-800"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </Button>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default StoryViewerPage;
