
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StoryViewer from '@/components/story-viewer/StoryViewer';
import { useStoryData } from '@/components/story-viewer/useStoryData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { LogIn, CreditCard } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const StoryViewerPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  const { story, isLoading, error } = useStoryData(id);
  
  // Redirect to home if there's an error loading the story
  useEffect(() => {
    if (error) {
      navigate('/');
    }
  }, [error, navigate]);

  // If user is not authenticated, show login notice
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-violet-600" />
                </div>
                <h1 className="text-3xl font-bold">Login Necessário</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para ler histórias, você precisa estar conectado à sua conta.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Voltar para Início
                  </Button>
                  <Button variant="storyPrimary" onClick={() => navigate("/auth")}>
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
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <Navbar />
        
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="container max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-violet-100 p-8 text-center"
            >
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-3xl font-bold">Assinatura Necessária</h1>
                <p className="text-gray-600 max-w-md mb-4">
                  Para ler histórias, você precisa ter uma assinatura ativa.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate("/")}>
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 pt-16">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : story ? (
          <StoryViewer 
            story={story} 
            initialPage={0} 
          />
        ) : (
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">História não encontrada</h2>
            <p className="text-gray-600 mb-8">Esta história não existe ou foi removida.</p>
            <Button onClick={() => navigate('/')}>Voltar para Início</Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default StoryViewerPage;
