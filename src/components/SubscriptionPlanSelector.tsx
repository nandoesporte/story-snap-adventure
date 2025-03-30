import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getSubscriptionPlans, checkUserSubscription, createMercadoPagoCheckout } from '@/lib/stripe';
import { getAvailablePaymentMethods } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Loader2, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

const SubscriptionPlanSelector = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState({ mercadopago: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mercadopago');
  const [intervalFilter, setIntervalFilter] = useState('month');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const methods = await getAvailablePaymentMethods();
        setPaymentMethods(methods);
        
        // Set Mercado Pago as default payment method
        if (methods.mercadopago) {
          setSelectedPaymentMethod('mercadopago');
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

  // Modified to directly open the payment dialog without needing the "Continue to payment" button
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentError('');
    
    // Check if Mercado Pago is available
    if (!paymentMethods.mercadopago) {
      toast.error('O método de pagamento Mercado Pago não está disponível');
      return;
    }
    
    // Open the payment dialog immediately
    setIsPaymentDialogOpen(true);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan) {
      toast.error('Selecione um plano antes de continuar');
      return;
    }
    
    try {
      setIsProcessing(true);
      setPaymentError('');
      
      const returnUrl = `${window.location.origin}/my-account`;
      
      const checkoutUrl = await createMercadoPagoCheckout(
        user.id,
        selectedPlan.id,
        returnUrl
      );
      
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
  const noPaymentMethodsConfigured = !paymentMethods.mercadopago;
  
  // Count available payment methods
  const availablePaymentMethods = Object.keys(paymentMethods).filter(key => paymentMethods[key]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 text-[#5E58A5]">Preços</h1>
      
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
                  O método de pagamento Mercado Pago não está configurado. Entre em contato com o administrador do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center my-8">
        <div className="bg-[#f0f0ff] rounded-full inline-flex p-1 shadow-sm">
          <Tabs value={intervalFilter} onValueChange={setIntervalFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-2 min-w-[260px]">
              <TabsTrigger
                value="month"
                className={`rounded-full py-2 px-6 ${intervalFilter === 'month' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#5E58A5]'}`}
              >
                MENSAL
              </TabsTrigger>
              <TabsTrigger
                value="year"
                className={`rounded-full py-2 px-6 relative ${intervalFilter === 'year' ? 'bg-[#8B5CF6] text-white shadow' : 'text-[#5E58A5]'}`}
              >
                ANUAL
                {intervalFilter === 'year' && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    SAVE 40%
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="month" className="hidden"></TabsContent>
            <TabsContent value="year" className="hidden"></TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Mobile View */}
      {isMobile ? (
        <div className="space-y-6 mb-8">
          {filteredPlans.map(plan => (
            <Card 
              key={plan.id}
              className={`overflow-hidden transition-all duration-200 ${selectedPlan?.id === plan.id ? 'border-[#8B5CF6] ring-1 ring-[#8B5CF6]/30' : 'border-border'}`}
            >
              <CardHeader className="bg-[#f8f8ff] pb-3 pt-5">
                <div className="relative">
                  {plan.interval === 'year' && calculateSavings(plan) > 0 && (
                    <Badge className="absolute -top-3 right-0 bg-[#844FFC] text-white">
                      {calculateSavings(plan)}% OFF
                    </Badge>
                  )}
                  <CardTitle className="text-xl text-[#5E58A5]">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-[#5E58A5]">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-sm text-[#727090] ml-1">
                      /{plan.interval === 'month' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Check className="text-green-500 h-5 w-5 mr-2" />
                    <span>{plan.stories_limit} histórias/mês</span>
                  </div>
                  {['Editar histórias', 'Criar personagens', 'Baixar em PDF', 'Narração de áudio'].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="text-green-500 h-5 w-5 mr-2" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-[#f8f8ff]/50 py-4">
                <Button 
                  className={`w-full ${selectedPlan?.id === plan.id ? 'bg-[#8B5CF6] hover:bg-[#7A4CE0]' : 'bg-white text-[#8B5CF6] hover:bg-[#f0f0ff] border border-[#8B5CF6]'}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {selectedPlan?.id === plan.id ? "Selecionado" : "Assinar"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        // Desktop Table View
        <div className="overflow-x-auto mb-8 hidden md:block">
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
      )}

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#8B5CF6]/90 to-[#6366F1]/90 p-5">
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Método de Pagamento</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full text-white hover:bg-white/20 h-8 w-8 -mr-2" 
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Continue para pagar sua assinatura
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2">Assinatura</h3>
              <div className="bg-muted rounded-md p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedPlan?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedPlan?.price)}/{selectedPlan?.interval === 'month' ? 'mês' : 'ano'}
                  </p>
                </div>
                <Badge variant="outline" className="bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20">
                  {selectedPlan?.interval === 'month' ? 'Mensal' : 'Anual'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Forma de pagamento</h3>
              
              {paymentMethods.mercadopago ? (
                <div 
                  className="border rounded-lg p-4 cursor-pointer transition-all bg-[#8B5CF6]/5 border-[#8B5CF6]"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full w-5 h-5 flex items-center justify-center border border-[#8B5CF6] bg-[#8B5CF6]">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        <Store className="h-4 w-4 mr-2 text-[#8B5CF6]" />
                        Mercado Pago
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cartão, Boleto e Pix
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-muted rounded-md">
                  <p className="text-muted-foreground">
                    Nenhum método de pagamento disponível
                  </p>
                </div>
              )}
            </div>
            
            {paymentError && (
              <div className="mt-6">
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-destructive flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Erro de processamento</p>
                    <p className="text-sm mt-1">{paymentError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8">
              <Button 
                className="w-full bg-[#8B5CF6] hover:bg-[#7A4CE0]"
                onClick={handleProceedToPayment}
                disabled={isProcessing || !paymentMethods.mercadopago}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Ao clicar em continuar, você será redirecionado para o site do Mercado Pago
                para completar o pagamento de forma segura.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlanSelector;
