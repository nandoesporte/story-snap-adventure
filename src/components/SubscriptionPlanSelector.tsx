
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, Circle, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getSubscriptionPlans, createSubscriptionCheckout, checkUserSubscription } from '@/lib/stripe';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const SubscriptionPlanSelector = () => {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  
  // Get subscription plans
  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
  });
  
  // Get user's current subscription
  const { data: userSubscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return checkUserSubscription(user.id);
    },
    enabled: !!user,
  });
  
  // Format currency
  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  // Format interval
  const formatInterval = (interval: string) => {
    return interval === 'month' ? 'mês' : 'ano';
  };
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };
  
  // Check if plan is the user's current plan
  const isCurrentPlan = (planId: string) => {
    return userSubscription?.subscription_plans?.id === planId;
  };
  
  // Handle subscription checkout
  const handleCheckout = async () => {
    if (!selectedPlanId || !user) {
      toast.error('Selecione um plano para continuar');
      return;
    }
    
    try {
      setIsCheckoutLoading(true);
      const returnUrl = window.location.origin + '/my-stories';
      const checkoutUrl = await createSubscriptionCheckout(user.id, selectedPlanId, returnUrl);
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erro ao processar checkout');
    } finally {
      setIsCheckoutLoading(false);
    }
  };
  
  if (loadingPlans || loadingSubscription) {
    return (
      <div className="flex justify-center items-center p-8">
        <p>Carregando planos...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-bold">Planos de Assinatura</h2>
        <p className="text-lg text-muted-foreground mt-4">
          Escolha o melhor plano para você e crie histórias incríveis para as crianças
        </p>
        
        {userSubscription && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">
              Você já possui o plano <span className="font-bold">{userSubscription.subscription_plans?.name}</span>
            </p>
            {userSubscription.cancel_at_period_end ? (
              <p className="text-sm text-muted-foreground mt-2">
                Sua assinatura será cancelada em {new Date(userSubscription.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                Próxima cobrança em {new Date(userSubscription.current_period_end).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card 
            key={plan.id} 
            className={`transition-all ${
              selectedPlanId === plan.id 
                ? 'border-primary shadow-lg ring-2 ring-primary' 
                : 'hover:border-primary/50'
            } ${isCurrentPlan(plan.id) ? 'bg-primary/5' : ''}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription className="mt-1">{plan.description}</CardDescription>
                </div>
                {isCurrentPlan(plan.id) && (
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    Plano Atual
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                <span className="text-muted-foreground ml-1">/{formatInterval(plan.interval)}</span>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Inclui:</h4>
                <ul className="space-y-2">
                  {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start text-sm font-medium">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                    <span>Limite de {plan.stories_limit} histórias por {formatInterval(plan.interval)}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              {isCurrentPlan(plan.id) ? (
                userSubscription?.cancel_at_period_end ? (
                  <Button className="w-full" variant="outline" disabled>
                    Cancelamento agendado
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        Cancelar assinatura
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar sua assinatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Você continuará tendo acesso ao plano até o final do período atual, em {new Date(userSubscription.current_period_end).toLocaleDateString('pt-BR')}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Confirmar cancelamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              ) : (
                <Button
                  className="w-full" 
                  variant={selectedPlanId === plan.id ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {selectedPlanId === plan.id ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Selecionado
                    </>
                  ) : (
                    'Selecionar'
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {selectedPlanId && !isCurrentPlan(selectedPlanId) && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={handleCheckout}
            disabled={isCheckoutLoading}
            className="px-8"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isCheckoutLoading ? 'Processando...' : 'Continuar para pagamento'}
          </Button>
        </div>
      )}
      
      <div className="mt-8 flex justify-center">
        <div className="flex items-center text-sm text-muted-foreground">
          <Shield className="mr-2 h-4 w-4" />
          Pagamentos processados com segurança pelo Stripe
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanSelector;
