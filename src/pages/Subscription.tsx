
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SubscriptionPlanSelector } from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

const Subscription = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <SubscriptionPlanSelector />
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
