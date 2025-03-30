
import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SubscriptionPlanSelector from '@/components/SubscriptionPlanSelector';
import { useAuth } from '@/context/AuthContext';
import { createAsaasCheckout } from '@/lib/asaas';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Subscription = () => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  
  // Get plan from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const planIdFromUrl = searchParams.get('plan');
  
  // Fetch plans to verify if the plan from URL exists
  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true);
      
      if (error) {
        console.error("Error fetching subscription plans:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!planIdFromUrl,
  });
  
  // Set selected plan from URL if it exists
  useEffect(() => {
    if (planIdFromUrl && plans.length > 0) {
      const planExists = plans.some((plan: any) => plan.id === planIdFromUrl);
      if (planExists) {
        setSelectedPlan(planIdFromUrl);
      }
    }
  }, [planIdFromUrl, plans]);
  
  // Handle plan selection
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    initiateCheckout(planId);
  };
  
  // Initiate checkout process
  const initiateCheckout = async (planId: string) => {
    if (!user) return;
    
    setIsCreatingCheckout(true);
    try {
      const returnUrl = `${window.location.origin}/subscription?success=true`;
      const checkoutUrl = await createAsaasCheckout(user.id, planId, returnUrl);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setIsCreatingCheckout(false);
    }
  };
  
  // Check for success message in URL after returning from payment
  useEffect(() => {
    const successParam = searchParams.get('success');
    if (successParam === 'true') {
      toast.success('Pagamento processado com sucesso! Sua assinatura estará ativa em breve.');
    }
  }, [searchParams]);
  
  if (authLoading || isLoadingPlans) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <p className="text-purple-800 text-lg">Carregando informações da conta...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (isCreatingCheckout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-purple-50">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <p className="text-purple-800 text-lg">Preparando pagamento...</p>
      </div>
    );
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
        <SubscriptionPlanSelector 
          selectedPlanId={selectedPlan} 
          onSelectPlan={handlePlanSelect} 
        />
      </motion.main>
      <Footer />
    </div>
  );
};

export default Subscription;
