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
  const [intervalFilter, setIntervalFilter] = useState('month');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const methods = await getAvailablePaymentMethods();
        setPaymentMethods(methods);
        
        if (methods.mercadopago) {
          setSelectedPaymentMethod('mercadopago');
        } else if (methods.asaas) {
          setSelectedPaymentMethod('asaas');
        }
        
        const plansData = await getSubscriptionPlans();
        setPlans(plansData);
        
        if (user) {
          try {
            const subscription = await checkUserSubscription(user.id);
            if (subscription) {
              setCurrentSubscription(subscription);
              
              if (subscription.plan_id) {
                const currentPlan = plansData.find(p => p.id === subscription.plan_id);
                if (currentPlan) {
                  setSelectedPlan(currentPlan);
                  setIntervalFilter(currentPlan.interval || 'month');
                }
              }
            }
          } catch (error) {
            console.error('Error checking user subscription:', error);
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
      
      const returnUrl = `${window.location.origin}/my-account`;
      
      let checkoutUrl;
      
      if (selectedPaymentMethod === 'mercadopago') {
        checkoutUrl = await createMercadoPagoCheckout(
          user.id,
          selectedPlan.id,
          returnUrl
        );
      } else if (selectedPaymentMethod === 'asaas') {
        console.log('Creating Asaas checkout with parameters:', {
          userId: user.id,
          planId: selectedPlan.id,
          returnUrl
        });
        
        checkoutUrl = await createAsaasCheckout(
          user.id,
          selectedPlan.id,
          returnUrl
        );
        
        console.log('Checkout URL returned:', checkoutUrl);
      }
      
      if (checkoutUrl) {
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

  const calculateSavings = (plan) => {
    if (plan.interval === 'year') {
      const monthlyEquivalent = plan.price / 12;
      const monthlyPlan = plans.find(p => p.interval === 'month' && p.name === plan.name);
      if (monthlyPlan) {
        const savings = ((monthlyPlan.price * 12) - plan.price) / (monthlyPlan.price * 12) * 100;
        return Math.round(savings);
      }
    }
    return 0;
  };

  const getMonthlyPrice = (plan) => {
    if (plan.interval === 'month') {
      return formatCurrency(plan.price) + '/mês';
    } else if (plan.interval === 'year') {
      const monthlyPrice = plan.price / 12;
      return formatCurrency(monthlyPrice) + '/mês';
    }
    return formatCurrency(plan.price);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando planos de assinatura...</p>
      </div>
    );
  }

  const filteredPlans = plans.filter(plan => plan.interval === intervalFilter);

  const noPaymentMethodsConfigured = !paymentMethods.mercadopago && !paymentMethods.asaas;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-5xl font-bold text-center mb-2 text-[#5E58A5]">Preços</h1>
      
      {currentSubscription && (
        <Card className="mb-8 border-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-xl font-medium">Sua assinatura atual</h2>
                <p className="text-muted-foreground">
                  {currentSubscription.subscription_plans?.name} - {formatCurrency(currentSubscription.subscription_plans?.price)}/{currentSubscription.subscription_plans?.interval === 'month' ? 'mês' : 'ano'}
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

      <div className="flex justify-center my-8">
        <div className="bg-[#f0f0ff] rounded-full inline-flex p-1 shadow-sm">
          <Tabs value={intervalFilter} onValueChange={setIntervalFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-2 min-w-[300px]">
              <TabsTrigger
                value="month"
                className={`rounded-full py-2 px-8 ${intervalFilter === 'month' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#5E58A5]'}`}
              >
                MENSAL
              </TabsTrigger>
              <TabsTrigger
                value="year"
                className={`rounded-full py-2 px-8 relative ${intervalFilter === 'year' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#5E58A5]'}`}
              >
                ANUAL
                {intervalFilter === 'year' && (
                  <span className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                    ECONOMIZE 40%
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="month" className="hidden"></TabsContent>
            <TabsContent value="year" className="hidden"></TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-4 px-4 font-medium text-lg text-[#5E58A5] w-1/3">Benefícios</th>
              {filteredPlans.map(plan => (
                <th key={plan.id} className="py-4 px-4 text-center">
                  <div className={`rounded-lg p-6 ${selectedPlan?.id === plan.id ? 'bg-[#f0f0ff] shadow-lg' : 'bg-[#f8f8ff]'}`}>
                    <div className="relative">
                      {plan.interval === 'year' && calculateSavings(plan) > 0 && (
                        <Badge className="absolute -top-10 -right-6 bg-[#844FFC] text-white">
                          {calculateSavings(plan)}% OFF
                        </Badge>
                      )}
                      <h3 className="text-2xl font-bold text-[#5E58A5] mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <div className="text-3xl font-bold text-[#5E58A5]">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-sm text-[#727090]">
                          {getMonthlyPrice(plan)}
                        </div>
                      </div>
                      <Button 
                        className={`w-full ${selectedPlan?.id === plan.id ? 'bg-[#8B5CF6] hover:bg-[#7A4CE0]' : 'bg-white text-[#8B5CF6] hover:bg-[#f0f0ff] border border-[#8B5CF6]'}`}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {selectedPlan?.id === plan.id ? "Selecionado" : "Assinar"}
                      </Button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-200">
              <td className="py-4 px-4 font-medium">Criar histórias</td>
              {filteredPlans.map(plan => (
                <td key={plan.id} className="py-4 px-4 text-center">
                  <div className="text-center">
                    {plan.stories_limit} histórias/mês
                  </div>
                </td>
              ))}
            </tr>
            {['Editar histórias', 'Criar personagens', 'Baixar em PDF', 'Narração de áudio'].map((feature, index) => (
              <tr key={index} className="border-t border-gray-200">
                <td className="py-4 px-4 font-medium">{feature}</td>
                {filteredPlans.map(plan => (
                  <td key={plan.id} className="py-4 px-4 text-center">
                    <Check className="inline-block text-green-500 h-6 w-6" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPlan && (
        <Card className="mb-8 border-[#8B5CF6]/20 bg-[#f8f8ff]">
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
              className="w-full sm:w-auto order-1 sm:order-2 bg-[#8B5CF6] hover:bg-[#7A4CE0]"
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
