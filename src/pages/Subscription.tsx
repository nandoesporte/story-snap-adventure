
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SubscriptionPlanSelector from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Subscription = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-800">Carregando...</div>
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-800">Escolha seu plano</h1>
          <p className="text-gray-600 mt-2">Desbloqueie recursos premium e crie histórias ilimitadas.</p>
        </div>
        <SubscriptionPlanSelector />
      </motion.main>
      <Footer />
    </div>
  );
};

export default Subscription;
