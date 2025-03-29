
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Pencil, Trash, Save, X, Plus, DollarSign, RefreshCw, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  getSubscriptionPlans,
  syncPlansWithStripe,
  getStripeProducts,
  getStripePrices,
  createStripeProduct,
  updateStripeProduct,
  SubscriptionPlan
} from '@/lib/stripe';

// Form schema for subscription plans
const planFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome do plano é obrigatório' }),
  description: z.string().min(2, { message: 'Descrição é obrigatória' }),
  price: z.coerce.number().positive({ message: 'Preço deve ser positivo' }),
  currency: z.string().default('BRL'),
  interval: z.enum(['month', 'year'], { 
    required_error: 'Intervalo de cobrança é obrigatório',
  }),
  stories_limit: z.coerce.number().int().positive({ message: 'Limite de histórias deve ser positivo' }),
  is_active: z.boolean().default(true),
  features: z.string().optional(),
  stripe_price_id: z.string().optional(),
  stripe_product_id: z.string().optional(),
  create_in_stripe: z.boolean().default(false),
});

// Type for user subscription
type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'pending' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
  user_profile: {
    email: string;
    display_name: string;
  };
  subscription_plan: {
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
  };
};

export const SubscriptionManager = () => {
  const queryClient = useQueryClient();
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  
  const form = useForm<z.infer<typeof planFormSchema>>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: 'BRL',
      interval: 'month',
      stories_limit: 5,
      is_active: true,
      features: '',
      stripe_price_id: '',
      stripe_product_id: '',
      create_in_stripe: false,
    },
  });
  
  // Get subscription plans
  const { data: plans, isLoading: loadingPlans, refetch: refetchPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
  });
  
  // Get Stripe products
  const { data: stripeProducts, isLoading: loadingStripeProducts, refetch: refetchStripeProducts } = useQuery({
    queryKey: ['stripe-products'],
    queryFn: getStripeProducts,
    onError: () => {
      setIsStripeConnected(false);
    },
    retry: false
  });
  
  // Set isStripeConnected when stripeProducts are successfully loaded
  useEffect(() => {
    if (stripeProducts) {
      setIsStripeConnected(true);
    }
  }, [stripeProducts]);
  
  // Get Stripe prices
  const { data: stripePrices, isLoading: loadingStripePrices, refetch: refetchStripePrices } = useQuery({
    queryKey: ['stripe-prices'],
    queryFn: getStripePrices,
    retry: false
  });
  
  // Get user subscriptions
  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          plan_id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          stripe_subscription_id,
          stripe_customer_id,
          created_at,
          updated_at,
          user_profile:user_profiles!user_id(
            display_name,
            email
          ),
          subscription_plan:subscription_plans!plan_id(
            name, 
            price, 
            currency, 
            interval
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data as unknown as UserSubscription[];
    },
  });
  
  // Sync plans with Stripe
  const syncPlansMutation = useMutation({
    mutationFn: syncPlansWithStripe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['stripe-products'] });
      queryClient.invalidateQueries({ queryKey: ['stripe-prices'] });
      toast.success('Planos sincronizados com o Stripe com sucesso');
    },
    onError: (error) => {
      console.error('Error syncing plans with Stripe:', error);
      toast.error('Erro ao sincronizar planos com o Stripe');
    },
  });
  
  // Create or update a subscription plan
  const planMutation = useMutation({
    mutationFn: async (values: z.infer<typeof planFormSchema>) => {
      // Process features into a JSON array
      const featuresArray = values.features 
        ? values.features.split('\n').filter(f => f.trim() !== '')
        : [];
        
      const planData = {
        ...values,
        features: featuresArray,
      };
      
      // If create_in_stripe is true, create product in Stripe first
      if (values.create_in_stripe) {
        try {
          let stripeResponse;
          
          if (editingPlan && editingPlan.stripe_product_id) {
            // Update existing product in Stripe
            stripeResponse = await updateStripeProduct(editingPlan.stripe_product_id, planData);
          } else {
            // Create new product in Stripe
            stripeResponse = await createStripeProduct(planData);
            
            // Update planData with Stripe IDs
            if (stripeResponse.product && stripeResponse.price) {
              planData.stripe_product_id = stripeResponse.product.id;
              planData.stripe_price_id = stripeResponse.price.id;
            }
          }
        } catch (error) {
          console.error('Error creating/updating product in Stripe:', error);
          throw new Error('Falha ao criar/atualizar produto no Stripe');
        }
      }
      
      // Now save to database
      if (editingPlan) {
        // Remove create_in_stripe from data to save
        const { create_in_stripe, ...dataToSave } = planData;
        
        // Update existing plan
        const { data, error } = await supabase
          .from('subscription_plans')
          .update(dataToSave)
          .eq('id', editingPlan.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Remove create_in_stripe from data to save
        const { create_in_stripe, ...dataToSave } = planData;
        
        // Create new plan
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert(dataToSave)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      closeDialog();
      toast.success(editingPlan ? 'Plano atualizado com sucesso' : 'Plano criado com sucesso');
    },
    onError: (error) => {
      console.error('Error saving plan:', error);
      toast.error('Erro ao salvar plano');
    },
  });
  
  // Delete a subscription plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);
        
      if (error) throw error;
      return planId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Plano removido com sucesso');
    },
    onError: (error) => {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao remover plano');
    },
  });
  
  // Cancel a user subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      // Call the cancel-subscription edge function
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast.success('Assinatura cancelada com sucesso');
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast.error('Erro ao cancelar assinatura');
    },
  });
  
  // Function to open the dialog for adding or editing a plan
  const openPlanDialog = (plan: SubscriptionPlan | null = null) => {
    if (plan) {
      // Editing existing plan
      setEditingPlan(plan);
      form.reset({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        stories_limit: plan.stories_limit,
        is_active: plan.is_active,
        features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        stripe_price_id: plan.stripe_price_id || '',
        stripe_product_id: plan.stripe_product_id || '',
        create_in_stripe: false,
      });
    } else {
      // Adding new plan
      setEditingPlan(null);
      form.reset({
        name: '',
        description: '',
        price: 0,
        currency: 'BRL',
        interval: 'month',
        stories_limit: 5,
        is_active: true,
        features: '',
        stripe_price_id: '',
        stripe_product_id: '',
        create_in_stripe: isStripeConnected,
      });
    }
    setIsAddPlanOpen(true);
  };
  
  // Function to close the dialog
  const closeDialog = () => {
    setIsAddPlanOpen(false);
    setEditingPlan(null);
    form.reset();
  };
  
  // Function to handle form submission
  const onSubmit = (values: z.infer<typeof planFormSchema>) => {
    planMutation.mutate(values);
  };
  
  // Function to refresh Stripe data
  const refreshStripeData = () => {
    refetchStripeProducts();
    refetchStripePrices();
    refetchPlans();
  };
  
  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  // Format interval
  const formatInterval = (interval: 'month' | 'year') => {
    return interval === 'month' ? 'mês' : 'ano';
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciamento de Assinaturas</h2>
        <div className="flex gap-2">
          {isStripeConnected && (
            <Button 
              onClick={() => syncPlansMutation.mutate()} 
              variant="outline" 
              disabled={syncPlansMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncPlansMutation.isPending ? 'animate-spin' : ''}`} />
              Sincronizar com Stripe
            </Button>
          )}
          <Button onClick={() => openPlanDialog()} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans">Planos de Assinatura</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas Ativas</TabsTrigger>
          <TabsTrigger value="stripe">
            Stripe API
            <Badge variant={isStripeConnected ? "default" : "destructive"} className="ml-2">
              {isStripeConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="plans" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Assinatura</CardTitle>
              <CardDescription>
                Gerencie os planos de assinatura disponíveis para os usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPlans ? (
                <div className="text-center py-4">Carregando planos...</div>
              ) : plans && plans.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Limite de Histórias</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ID Stripe</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{formatCurrency(plan.price, plan.currency)}</TableCell>
                        <TableCell>{formatInterval(plan.interval)}</TableCell>
                        <TableCell>{plan.stories_limit}</TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? "default" : "outline"}>
                            {plan.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {plan.stripe_price_id ? (
                            <span className="text-xs text-muted-foreground truncate max-w-xs">
                              {plan.stripe_price_id}
                            </span>
                          ) : (
                            <Badge variant="outline">Não configurado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              onClick={() => openPlanDialog(plan)} 
                              variant="outline" 
                              size="sm"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover plano</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover o plano "{plan.name}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deletePlanMutation.mutate(plan.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum plano cadastrado. Clique em "Novo Plano" para adicionar.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Ativas</CardTitle>
              <CardDescription>
                Visualize e gerencie as assinaturas ativas dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscriptions ? (
                <div className="text-center py-4">Carregando assinaturas...</div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Próxima Cobrança</TableHead>
                      <TableHead>Cancelamento</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div className="font-medium">{subscription.user_profile?.display_name}</div>
                          <div className="text-xs text-muted-foreground">{subscription.user_profile?.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>{subscription.subscription_plan?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(subscription.subscription_plan?.price || 0, subscription.subscription_plan?.currency || 'BRL')} / {formatInterval(subscription.subscription_plan?.interval || 'month')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status === 'active' ? 'Ativa' : 
                             subscription.status === 'canceled' ? 'Cancelada' :
                             subscription.status === 'past_due' ? 'Pagamento Atrasado' :
                             subscription.status === 'pending' ? 'Pendente' : 'Período de Teste'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(subscription.current_period_start)}</TableCell>
                        <TableCell>{formatDate(subscription.current_period_end)}</TableCell>
                        <TableCell>
                          {subscription.cancel_at_period_end ? (
                            <Badge variant="outline">Será cancelada</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50">Renovação automática</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Cancelar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancelar assinatura</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    A assinatura será cancelada ao final do período atual. Tem certeza que deseja prosseguir?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Não</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Sim, cancelar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma assinatura ativa encontrada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stripe" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Stripe</CardTitle>
              <CardDescription>
                Configure e gerencie a integração com a API do Stripe para processamento de pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Status da Conexão</h3>
                  <p className="text-sm text-muted-foreground">
                    Status da conexão com a API do Stripe
                  </p>
                </div>
                <Badge variant={isStripeConnected ? "default" : "destructive"} className="h-8 px-3 py-1">
                  {isStripeConnected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Dados do Stripe</h3>
                
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={refreshStripeData} 
                    variant="outline" 
                    disabled={loadingStripeProducts || loadingStripePrices}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loadingStripeProducts || loadingStripePrices ? 'animate-spin' : ''}`} />
                    Atualizar Dados
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium mb-2">Produtos no Stripe</h4>
                    {loadingStripeProducts ? (
                      <div className="text-center py-4">Carregando produtos...</div>
                    ) : !isStripeConnected ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Não foi possível conectar ao Stripe. Verifique se a chave API está configurada corretamente.
                      </div>
                    ) : stripeProducts && stripeProducts.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stripeProducts.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell className="font-mono text-xs">{product.id}</TableCell>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="truncate max-w-xs">{product.description}</TableCell>
                              <TableCell>
                                <Badge variant={product.active ? "default" : "outline"}>
                                  {product.active ? "Ativo" : "Inativo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                  <a 
                                    href={`https://dashboard.stripe.com/products/${product.id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver no Stripe
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhum produto encontrado no Stripe.
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium mb-2">Preços no Stripe</h4>
                    {loadingStripePrices ? (
                      <div className="text-center py-4">Carregando preços...</div>
                    ) : !isStripeConnected ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Não foi possível conectar ao Stripe. Verifique se a chave API está configurada corretamente.
                      </div>
                    ) : stripePrices && stripePrices.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Recorrência</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stripePrices.map((price: any) => (
                            <TableRow key={price.id}>
                              <TableCell className="font-mono text-xs">{price.id}</TableCell>
                              <TableCell className="font-mono text-xs">{price.product}</TableCell>
                              <TableCell>
                                {formatCurrency(price.unit_amount / 100, price.currency)}
                              </TableCell>
                              <TableCell>
                                {price.recurring ? (
                                  <span>
                                    {price.recurring.interval_count} {price.recurring.interval}
                                    {price.recurring.interval_count > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <Badge variant="outline">One-time</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="outline" size="sm">
                                  <a 
                                    href={`https://dashboard.stripe.com/prices/${price.id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Ver no Stripe
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhum preço encontrado no Stripe.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col items-start gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Links Úteis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="justify-start">
                    <a 
                      href="https://dashboard.stripe.com/products" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Dashboard de Produtos
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <a 
                      href="https://dashboard.stripe.com/subscriptions" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Dashboard de Assinaturas
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <a 
                      href="https://dashboard.stripe.com/test/customers" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Dashboard de Clientes
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="justify-start">
                    <a 
                      href="https://dashboard.stripe.com/test/webhooks" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Configuração de Webhooks
                    </a>
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mt-4 bg-muted p-4 rounded-md w-full">
                <p className="font-medium mb-2">Como configurar o Stripe:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Crie uma conta no Stripe e obtenha sua chave secreta API</li>
                  <li>Adicione a chave secreta nas configurações da Edge Function (STRIPE_SECRET_KEY)</li>
                  <li>Configure o webhook do Stripe para apontar para sua função stripe-webhook</li>
                  <li>Obtenha o segredo do webhook e adicione-o às configurações (STRIPE_WEBHOOK_SECRET)</li>
                  <li>Crie produtos e preços no Stripe ou sincronize seus planos existentes</li>
                </ol>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog for adding/editing plans */}
      <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Atualize as informações do plano de assinatura'
                : 'Preencha os detalhes para criar um novo plano de assinatura'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Plano Ativo</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="number" min="0" step="0.01" className="pl-8" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo de Cobrança</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um intervalo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="month">Mensal</SelectItem>
                          <SelectItem value="year">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stories_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Histórias</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormDescription>
                        Quantidade de histórias que o usuário pode criar por período
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isStripeConnected && (
                  <FormField
                    control={form.control}
                    name="create_in_stripe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div>
                          <FormLabel>Criar no Stripe</FormLabel>
                          <FormDescription>
                            Também criar/atualizar este plano no Stripe
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {isStripeConnected && form.watch('create_in_stripe') === false && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stripe_product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Produto no Stripe</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="prod_..." />
                        </FormControl>
                        <FormDescription>
                          ID do produto no Stripe (começa com "prod_")
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stripe_price_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID do Preço no Stripe</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="price_..." />
                        </FormControl>
                        <FormDescription>
                          ID do preço no Stripe (começa com "price_")
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recursos do Plano</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Digite um recurso por linha"
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormDescription>
                      Liste os recursos incluídos no plano, um por linha
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={planMutation.isPending}>
                  {planMutation.isPending ? 'Salvando...' : editingPlan ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManager;
