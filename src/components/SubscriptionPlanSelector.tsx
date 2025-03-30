import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Loader, Store, RefreshCw } from 'lucide-react';
import { SubscriptionPlan, checkUserSubscription, createMercadoPagoCheckout, getSubscriptionPlans, getAvailablePaymentMethods } from '@/lib/stripe';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader, DialogFooter } from '@/components/ui/dialog';

export const SubscriptionPlanSelector = () => {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePaymentMethod, setActivePaymentMethod] = useState("mercadopago");
  const [retryCount, setRetryCount] = useState(0);

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await checkUserSubscription(user.id);
    },
    enabled: !!user
  });

  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      return await getAvailablePaymentMethods();
    }
  });

  useEffect(() => {
    if (paymentMethods) {
      if (paymentMethods.mercadopago) {
        setActivePaymentMethod("mercadopago");
      }
    }
  }, [paymentMethods]);

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      return await getSubscriptionPlans();
    }
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setIsPaymentDialogOpen(true);
    setError(null);
  };

  const hasEnabledPaymentMethods = paymentMethods && paymentMethods.mercadopago;

  const handleCheckout = async () => {
    if (!user || !selectedPlanId || !hasEnabledPaymentMethods) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const returnUrl = window.location.origin + '/my-stories'; // Redirect to my stories after payment
      
      console.log('Creating checkout with:', { userId: user.id, planId: selectedPlanId, returnUrl });
      
      let checkoutUrl;
      let currentRetryCount = 0;
      const maxRetries = 2;
      
      const attemptCheckout = async () => {
        try {
          return await createMercadoPagoCheckout(user.id, selectedPlanId, returnUrl);
        } catch (requestError) {
          console.error(`Checkout attempt ${currentRetryCount + 1} failed:`, requestError);
          
          if (currentRetryCount >= maxRetries) {
            throw requestError;
          }
          
          const delay = 300 * Math.pow(2, currentRetryCount);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          currentRetryCount++;
          return null;
        }
      };
      
      while (checkoutUrl === undefined || checkoutUrl === null) {
        if (currentRetryCount > maxRetries) {
          break;
        }
        checkoutUrl = await attemptCheckout();
      }
      
      if (!checkoutUrl) {
        throw new Error("Não foi possível obter a URL de checkout do Mercado Pago. Verifique se a API está configurada corretamente.");
      }
      
      // Safety check for URL validity
      try {
        new URL(checkoutUrl);
      } catch (urlError) {
        throw new Error(`URL de checkout inválida: ${checkoutUrl}`);
      }
      
      toast.success(`Redirecionando para o Mercado Pago...`);
      
      // Brief timeout to allow the toast to be seen
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);
    } catch (error) {
      console.error('Error creating checkout:', error);
      
      let errorMessage = 'Ocorreu um erro ao processar o pagamento.';
      
      if (error.message) {
        errorMessage = `${error.message}`;
        
        if (error.message.includes('Failed to send') || error.message.includes('Failed to fetch') || 
            error.message.includes('conexão') || error.message.includes('conectar')) {
          errorMessage = 'Não foi possível conectar ao servidor de pagamento. Verifique sua conexão ou se a API está configurada corretamente.';
        }
        
        if (error.message.includes('não está configurada') || error.message.includes('API key') || 
            error.message.includes('token') || error.message.includes('vazio')) {
          errorMessage = 'O Mercado Pago não está configurado corretamente. Entre em contato com o administrador.';
        } else if (error.message.includes('inválido')) {
          errorMessage = 'A chave do Mercado Pago é inválida. Entre em contato com o administrador.';
        } else if (error.message.includes('quota') || error.message.includes('limite')) {
          errorMessage = 'Limite de requisições excedido no Mercado Pago. Tente novamente em alguns minutos.';
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    handleCheckout();
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

  if (paymentMethods && !hasEnabledPaymentMethods) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-destructive/10 p-6 rounded-lg shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Sistema de pagamento indisponível</h2>
          <p className="mb-4">
            Nosso sistema de pagamento está temporariamente indisponível. Por favor, tente novamente mais tarde.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
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
                  disabled={isProcessing || !hasEnabledPaymentMethods}
                >
                  {isProcessing && selectedPlanId === plan.id ? 'Processando...' : 'Assinar agora'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog 
        open={isPaymentDialogOpen} 
        onOpenChange={(open) => {
          if (!isProcessing || !open) {
            setIsPaymentDialogOpen(open);
            if (open) setError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento com Mercado Pago</DialogTitle>
            <DialogDescription>
              Você será redirecionado para o Mercado Pago para completar o pagamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {hasEnabledPaymentMethods ? (
              <div className="mt-4">
                <div className="text-sm text-muted-foreground">
                  <p>Checkout seguro via Mercado Pago.</p>
                  <p>Aceita diversos métodos de pagamento, incluindo cartões nacionais, boleto e Pix.</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Você será redirecionado para o site do Mercado Pago para completar o pagamento de forma segura.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-destructive/10 rounded-md">
                <p className="text-destructive">Nenhum método de pagamento disponível no momento.</p>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive space-y-2">
                <p>{error}</p>
                <Button 
                  onClick={handleRetry} 
                  disabled={isProcessing} 
                  variant="outline" 
                  size="sm"
                  className="mt-2 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => !isProcessing && setIsPaymentDialogOpen(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => !isProcessing && handleCheckout()}
              disabled={isProcessing || !hasEnabledPaymentMethods}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
              type="button"
            >
              {isProcessing ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>Continuar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
