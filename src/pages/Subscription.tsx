
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SubscriptionPlanSelector from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Subscription = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <p className="text-purple-800 text-lg">Carregando...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-purple-50">
      <Navbar />
      <motion.main 
        className="flex-grow container mx-auto px-4 py-8 pt-24 md:pt-32"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-3">Escolha seu plano</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Desbloqueie recursos premium e crie histórias ilimitadas para expandir a imaginação do seu filho.
          </p>
        </motion.div>
        <SubscriptionPlanSelector />
      </motion.main>
      <Footer />
    </div>
  );
};

export default Subscription;
