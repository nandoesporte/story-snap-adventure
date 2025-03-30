
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Loader, CreditCard, Store } from 'lucide-react';
import { SubscriptionPlan, checkUserSubscription, createSubscriptionCheckout, createMercadoPagoCheckout, getSubscriptionPlans, getAvailablePaymentMethods } from '@/lib/stripe';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const SubscriptionPlanSelector = () => {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePaymentMethod, setActivePaymentMethod] = useState("stripe");

  // Fetch current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await checkUserSubscription(user.id);
    },
    enabled: !!user
  });

  // Fetch available payment methods
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      return await getAvailablePaymentMethods();
    }
  });

  // Set default payment method when data loads
  useEffect(() => {
    if (paymentMethods) {
      if (paymentMethods.stripe) {
        setActivePaymentMethod("stripe");
      } else if (paymentMethods.mercadopago) {
        setActivePaymentMethod("mercadopago");
      }
    }
  }, [paymentMethods]);

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      return await getSubscriptionPlans();
    }
  });

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsPaymentDialogOpen(true);
    setError(null);
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (!user || !selectedPlanId) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const returnUrl = window.location.origin + '/my-stories'; // Redirect to my stories after payment
      
      console.log('Creating checkout with:', { userId: user.id, planId: selectedPlanId, returnUrl });
      
      let checkoutUrl;
      
      if (activePaymentMethod === "mercadopago") {
        checkoutUrl = await createMercadoPagoCheckout(user.id, selectedPlanId, returnUrl);
      } else {
        // Default to Stripe
        checkoutUrl = await createSubscriptionCheckout(user.id, selectedPlanId, returnUrl);
      }
      
      // Redirect to checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      
      // Try to get a more specific error message
      if (error.message) {
        setError(`${error.message}`);
        
        // Show a more user-friendly message for common errors
        if (error.message.includes('Failed to send') || error.message.includes('Failed to fetch')) {
          setError('Não foi possível conectar ao servidor de pagamento. Verifique sua conexão ou se a API do Stripe está configurada corretamente.');
        }
      }
      
      setIsProcessing(false);
    }
  };

  const isLoading = isLoadingSubscription || isLoadingPlans;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader className="h-8 w-8 animate-spin mr-2" />
        <p>Carregando planos de assinatura...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Escolha seu plano</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Selecione o plano que melhor atende às suas necessidades e comece a criar histórias incríveis para seus filhos.
        </p>
      </div>
      
      {subscription ? (
        <div className="max-w-md mx-auto bg-muted p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Sua assinatura atual</h2>
          <p className="mb-2">
            <span className="font-medium">Plano:</span> {subscription.subscription_plans.name}
          </p>
          <p className="mb-2">
            <span className="font-medium">Status:</span> {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
          </p>
          <p className="mb-2">
            <span className="font-medium">Renova em:</span> {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(true)}>
              Mudar de plano
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {plans?.map((plan) => (
            <Card 
              key={plan.id} 
              className={`flex flex-col hover:shadow-md transition-shadow duration-300 ${selectedPlanId === plan.id ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-4">
                  <span className="text-3xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: plan.currency,
                    }).format(plan.price)}
                  </span>
                  <span className="text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Histórias incluídas:</span> {plan.stories_limit} por {plan.interval === 'month' ? 'mês' : 'ano'}
                  </p>
                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-1">
                      {Array.isArray(plan.features) ? plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      )) : null}
                    </ul>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlanId === plan.id ? 'Processando...' : 'Assinar agora'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Payment Method Selection Dialog */}
      <AlertDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Selecione o método de pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha como você prefere pagar sua assinatura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Tabs 
              value={activePaymentMethod} 
              onValueChange={setActivePaymentMethod}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                {paymentMethods?.stripe && (
                  <TabsTrigger value="stripe" disabled={isProcessing} className="flex items-center justify-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span>Cartão de crédito</span>
                  </TabsTrigger>
                )}
                {paymentMethods?.mercadopago && (
                  <TabsTrigger value="mercadopago" disabled={isProcessing} className="flex items-center justify-center">
                    <Store className="h-4 w-4 mr-2" />
                    <span>Mercado Pago</span>
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="stripe" className="mt-4">
                <div className="text-sm text-muted-foreground">
                  <p>Checkout seguro via Stripe.</p>
                  <p>Aceita diversos cartões de crédito internacionais.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="mercadopago" className="mt-4">
                <div className="text-sm text-muted-foreground">
                  <p>Checkout seguro via Mercado Pago.</p>
                  <p>Aceita diversos métodos de pagamento, incluindo cartões nacionais, boleto e Pix.</p>
                </div>
              </TabsContent>
            </Tabs>
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCheckout}
              disabled={isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>Continuar</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
