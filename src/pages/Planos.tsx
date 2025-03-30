
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Check, CreditCard, Package, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const Planos = () => {
  const { user } = useAuth();
  
  // Fetch subscription plans from the database
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) {
        console.error("Erro ao carregar planos:", error);
        return [];
      }
      
      return data;
    },
  });

  // Handle the case when no subscription plans are found
  const defaultPlans = [
    {
      id: 'basic',
      name: 'Básico',
      description: 'Acesso limitado a histórias infantis',
      price: 19.90,
      currency: 'BRL',
      interval: 'month',
      stories_limit: 5,
      features: ["Criação de 5 histórias por mês", "Acesso à biblioteca básica de personagens", "Download de histórias em PDF"]
    },
    {
      id: 'standard',
      name: 'Padrão',
      description: 'Para famílias que adoram histórias',
      price: 39.90,
      currency: 'BRL',
      interval: 'month',
      stories_limit: 15,
      features: ["Criação de 15 histórias por mês", "Acesso à biblioteca completa de personagens", "Download de histórias em PDF", "Narração de áudio"]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Experiência completa de histórias',
      price: 59.90,
      currency: 'BRL',
      interval: 'month',
      stories_limit: 50,
      features: ["Criação de histórias ilimitadas", "Acesso prioritário a novos recursos", "Personagens personalizados", "Narração de áudio premium", "Suporte prioritário"]
    }
  ];

  const renderPlans = plans.length > 0 ? plans : defaultPlans;

  // Format currency
  const formatCurrency = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-indigo-50">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-indigo-800 mb-4">
              Escolha o plano perfeito para você
            </h1>
            <p className="text-lg text-indigo-600">
              Desbloqueie recursos incríveis para criar histórias mágicas para seus filhos
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {renderPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-2xl overflow-hidden border shadow-lg ${
                  index === 1 
                    ? "border-indigo-500 shadow-indigo-100" 
                    : "border-gray-200"
                }`}
              >
                <div className={`p-6 ${
                  index === 1 ? "bg-indigo-600" : "bg-white"
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-2xl font-bold ${
                      index === 1 ? "text-white" : "text-indigo-800"
                    }`}>
                      {plan.name}
                    </h3>
                    {index === 1 && (
                      <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-white rounded-full">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 ${
                    index === 1 ? "text-indigo-100" : "text-gray-600"
                  }`}>
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${
                      index === 1 ? "text-white" : "text-indigo-800"
                    }`}>
                      {formatCurrency(plan.price, plan.currency)}
                    </span>
                    <span className={`${
                      index === 1 ? "text-indigo-100" : "text-gray-500"
                    }`}>
                      /{plan.interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 bg-white">
                  <ul className="space-y-4">
                    {Array.isArray(plan.features) ? plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    )) : (
                      <li className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-gray-700">{plan.stories_limit} histórias por mês</span>
                      </li>
                    )}
                  </ul>
                  
                  <div className="mt-8">
                    <Link to={user ? "/subscription" : "/register"}>
                      <Button
                        className={`w-full py-3 ${
                          index === 1 
                            ? "bg-indigo-600 hover:bg-indigo-700" 
                            : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                        }`}
                        variant={index === 1 ? "default" : "outline"}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {user ? "Assinar Agora" : "Inscrever-se"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-indigo-800 mb-4">
              Perguntas Frequentes
            </h2>
            <div className="space-y-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-indigo-800">Posso cancelar a qualquer momento?</h3>
                <p className="mt-2 text-gray-600">Sim, você pode cancelar sua assinatura a qualquer momento sem taxas adicionais.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-indigo-800">Como funciona o limite de histórias?</h3>
                <p className="mt-2 text-gray-600">Cada plano permite a criação de um número específico de histórias por mês. O contador é reiniciado no início de cada ciclo de cobrança.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-indigo-800">Posso mudar de plano depois?</h3>
                <p className="mt-2 text-gray-600">Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento, e a cobrança será ajustada proporcionalmente.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Planos;
