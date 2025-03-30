
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getSubscriptionPlans, checkUserSubscription, createMercadoPagoCheckout } from '@/lib/stripe';
import { createAsaasCheckout } from '@/lib/asaas';
import { getAvailablePaymentMethods } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, CreditCard, Loader2, Store } from 'lucide-react';
import { toast } from 'sonner';

const SubscriptionPlanSelector = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState({ mercadopago: false, asaas: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Fetch subscription plans and user current subscription
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get available payment methods
        const methods = await getAvailablePaymentMethods();
        setPaymentMethods(methods);
        
        // Set default payment method if available
        if (methods.mercadopago) {
          setSelectedPaymentMethod('mercadopago');
        } else if (methods.asaas) {
          setSelectedPaymentMethod('asaas');
        }
        
        // Get subscription plans
        const plansData = await getSubscriptionPlans();
        setPlans(plansData);
        
        // Check current subscription
        if (user) {
          const subscription = await checkUserSubscription(user.id);
          setCurrentSubscription(subscription);
          
          // Set the current plan as selected by default
          if (subscription && subscription.subscription_plan_id) {
            const currentPlan = plansData.find(p => p.id === subscription.subscription_plan_id);
            if (currentPlan) {
              setSelectedPlan(currentPlan);
            }
          }
        }
      } catch (error) {
        console.error('Error loading subscription data:', error);
        toast.error('Erro ao carregar planos de assinatura');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentError('');
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan) {
      toast.error('Selecione um plano antes de continuar');
      return;
    }
    
    if (!selectedPaymentMethod) {
      toast.error('Selecione um método de pagamento antes de continuar');
      return;
    }
    
    try {
      setIsProcessing(true);
      setPaymentError('');
      
      // Return URL after payment
      const returnUrl = `${window.location.origin}/my-account`;
      
      let checkoutUrl;
      
      // Process based on selected payment method
      if (selectedPaymentMethod === 'mercadopago') {
        checkoutUrl = await createMercadoPagoCheckout(
          user.id,
          selectedPlan.id,
          returnUrl
        );
      } else if (selectedPaymentMethod === 'asaas') {
        checkoutUrl = await createAsaasCheckout(
          user.id,
          selectedPlan.id,
          returnUrl
        );
      }
      
      if (checkoutUrl) {
        // Redirect to checkout
        window.location.href = checkoutUrl;
      } else {
        throw new Error('URL de checkout inválida');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Não foi possível conectar ao servidor de pagamento. Verifique sua conexão ou se a API está configurada corretamente.');
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate savings for annual plans
  const calculateSavings = (plan) => {
    if (plan.interval === 'year') {
      const monthlyEquivalent = plan.price / 12;
      const monthlyPlan = plans.find(p => p.interval === 'month');
      if (monthlyPlan) {
        const savings = ((monthlyPlan.price * 12) - plan.price) / (monthlyPlan.price * 12) * 100;
        return Math.round(savings);
      }
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando planos de assinatura...</p>
      </div>
    );
  }

  // If no payment methods are available
  const noPaymentMethodsConfigured = !paymentMethods.mercadopago && !paymentMethods.asaas;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Escolha seu plano</h1>
      
      {currentSubscription && (
        <Card className="mb-8 border-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-xl font-medium">Sua assinatura atual</h2>
                <p className="text-muted-foreground">
                  {currentSubscription.subscription_plans.name} - {formatCurrency(currentSubscription.subscription_plans.price)}/{currentSubscription.subscription_plans.interval === 'month' ? 'mês' : 'ano'}
                </p>
                <p className="text-sm mt-2">
                  Válida até {new Date(currentSubscription.current_period_end).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600 self-start md:self-center">
                <Check className="mr-1 h-4 w-4" /> Ativa
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {noPaymentMethodsConfigured && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-destructive h-6 w-6 mt-0.5" />
              <div>
                <h2 className="text-lg font-medium text-destructive">Configuração de pagamento necessária</h2>
                <p className="text-muted-foreground mt-1">
                  Os métodos de pagamento não estão configurados. Entre em contato com o administrador do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''}`}
          >
            {plan.interval === 'year' && calculateSavings(plan) > 0 && (
              <Badge className="absolute -top-3 right-4 bg-green-600">
                Economize {calculateSavings(plan)}%
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription className="mt-2">
                <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                <span className="text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{plan.description}</p>
              <p className="font-medium mb-2">O que está incluído:</p>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="text-green-600 mr-2 h-5 w-5 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                <li className="flex items-start">
                  <Check className="text-green-600 mr-2 h-5 w-5 mt-0.5" />
                  <span>Até {plan.stories_limit} histórias por mês</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={selectedPlan?.id === plan.id ? "default" : "outline"}
                onClick={() => handleSelectPlan(plan)}
              >
                {selectedPlan?.id === plan.id ? "Selecionado" : "Selecionar"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Método de Pagamento</CardTitle>
            <CardDescription>Escolha como deseja pagar sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={selectedPaymentMethod} 
              onValueChange={setSelectedPaymentMethod}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger 
                  value="mercadopago" 
                  disabled={!paymentMethods.mercadopago}
                  className="flex items-center justify-center"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Mercado Pago
                </TabsTrigger>
                <TabsTrigger 
                  value="asaas" 
                  disabled={!paymentMethods.asaas}
                  className="flex items-center justify-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Asaas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="mercadopago" className="pt-4">
                <div className="space-y-4">
                  <p>
                    <span className="font-medium">Pagamento com Mercado Pago</span>
                    <br />
                    Você será redirecionado para o Mercado Pago para completar o pagamento.
                  </p>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Checkout seguro via Mercado Pago.</span>
                      <br />
                      Aceita diversos métodos de pagamento, incluindo cartões nacionais, boleto e Pix.
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="asaas" className="pt-4">
                <div className="space-y-4">
                  <p>
                    <span className="font-medium">Pagamento com Asaas</span>
                    <br />
                    Você será redirecionado para a plataforma de pagamento para completar sua compra.
                  </p>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm">
                      <span className="font-medium">Checkout seguro via Asaas.</span>
                      <br />
                      Aceita cartões de crédito, boleto bancário e Pix.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          {paymentError && (
            <div className="px-6 pb-4">
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md text-destructive flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Erro de processamento</p>
                  <p className="text-sm mt-1">{paymentError}</p>
                </div>
              </div>
            </div>
          )}
          
          <CardFooter className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Ao clicar no botão continuar, você será redirecionado para o site do 
              {selectedPaymentMethod === 'mercadopago' ? ' Mercado Pago' : ' Asaas'} 
              para completar o pagamento de forma segura.
            </div>
            <Button 
              onClick={handleProceedToPayment} 
              className="w-full sm:w-auto order-1 sm:order-2"
              disabled={isProcessing || noPaymentMethodsConfigured || !selectedPaymentMethod}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : paymentError ? (
                "Tentar novamente"
              ) : (
                "Continuar"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionPlanSelector;
