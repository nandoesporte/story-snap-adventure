
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, UserPlus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface User {
  id: string;
  email: string;
  display_name?: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  subscription_plans?: {
    name: string;
    stories_limit: number;
    price: number;
    currency: string;
    interval: string;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  stories_limit: number;
}

const UserSubscriptionManager = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user emails
      const usersWithEmail = await Promise.all(
        data.map(async (user) => {
          return {
            id: user.id,
            display_name: user.display_name,
            email: user.display_name // Using display_name as email since that's typically how it's stored
          };
        })
      );
      
      return usersWithEmail;
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch user subscriptions
  const { data: subscriptions, isLoading: isLoadingSubscriptions, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['user-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Manually activate subscription
  const activateSubscription = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      // Get the selected plan details
      const plan = plans?.find((p) => p.id === planId);
      if (!plan) throw new Error('Plano não encontrado');

      // Calculate period dates
      const currentPeriodStart = new Date();
      let currentPeriodEnd = new Date();
      
      if (plan.interval === 'month') {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else if (plan.interval === 'year') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }

      // First, check if user already has an active subscription
      const { data: existingSub, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            plan_id: planId,
            status: 'active', 
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            cancel_at_period_end: false
          })
          .eq('id', existingSub.id);

        if (updateError) throw updateError;
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            current_period_start: currentPeriodStart.toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
            cancel_at_period_end: false
          });

        if (insertError) throw insertError;
      }

      // Record in subscription history
      await supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          plan_id: planId,
          action: 'created',
          details: { 
            method: 'manual', 
            admin_activated: true,
            plan_name: plan.name,
            stories_limit: plan.stories_limit
          }
        });

      // Reset user's story count for the new period
      await supabase.rpc('reset_user_story_count', { user_uuid: userId });

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Assinatura ativada com sucesso');
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSelectedPlanId('');
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    },
    onError: (error: any) => {
      console.error('Error activating subscription:', error);
      toast.error(`Erro ao ativar assinatura: ${error.message}`);
    }
  });

  // Handle searching users
  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Open dialog to select plan for a user
  const openPlanSelectionDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedPlanId(plans && plans.length > 0 ? plans[0].id : '');
    setIsDialogOpen(true);
  };

  // Handle activation
  const handleActivateSubscription = () => {
    if (!selectedUser || !selectedPlanId) {
      toast.error('Selecione um usuário e um plano');
      return;
    }

    activateSubscription.mutate({ 
      userId: selectedUser.id, 
      planId: selectedPlanId 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <h3 className="text-xl font-medium">Assinaturas de Usuários</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-8 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => refetchSubscriptions()} size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingUsers || isLoadingSubscriptions ? (
          <p>Carregando...</p>
        ) : (
          <>
            {/* Active Subscriptions */}
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((subscription: UserSubscription) => {
                const user = users?.find(u => u.id === subscription.user_id);
                return (
                  <Card key={subscription.id} className="border border-green-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex justify-between items-center">
                        <span className="truncate">{user?.email || subscription.user_id}</span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Ativo
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        ID: {subscription.user_id.substring(0, 8)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plano:</span>
                          <span className="font-medium">{subscription.subscription_plans?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Limite:</span>
                          <span>{subscription.subscription_plans?.stories_limit} histórias</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Período:</span>
                          <span>
                            {subscription.subscription_plans?.interval === 'month' ? 'Mensal' : 'Anual'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expira em:</span>
                          <span>
                            {subscription.current_period_end
                              ? format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: ptBR })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => user && openPlanSelectionDialog(user)}
                      >
                        Alterar plano
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="md:col-span-2 lg:col-span-3 text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">Nenhuma assinatura ativa encontrada.</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t pt-6 mt-8">
        <h3 className="text-lg font-medium mb-4">Ativar Assinatura Manualmente</h3>
        
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md mb-6">
          <h4 className="font-medium text-amber-800 mb-1">Atenção</h4>
          <p className="text-amber-700 text-sm">
            Use esta funcionalidade apenas quando a ativação automática falhar. 
            Cada crédito permite a criação de uma história.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {filteredUsers.slice(0, 9).map((user) => (
            <Card key={user.id} className="cursor-pointer hover:border-primary" onClick={() => openPlanSelectionDialog(user)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base truncate">{user.email}</CardTitle>
                <CardDescription className="text-xs">
                  ID: {user.id.substring(0, 8)}...
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ativar plano
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {searchTerm && filteredUsers.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-muted-foreground">Nenhum usuário encontrado para "{searchTerm}"</p>
          </div>
        )}

        {!searchTerm && users && users.length > 9 && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Exibindo 9 de {users.length} usuários. Use a busca para encontrar um usuário específico.
            </p>
          </div>
        )}
      </div>

      {/* Plan Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Assinatura</DialogTitle>
            <DialogDescription>
              Selecione um plano para ativar manualmente para {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-select">Plano de Assinatura</Label>
              <Select
                value={selectedPlanId}
                onValueChange={setSelectedPlanId}
              >
                <SelectTrigger id="plan-select">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan: SubscriptionPlan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.stories_limit} histórias/{plan.interval === 'month' ? 'mês' : 'ano'} (
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: plan.currency,
                        }).format(plan.price)}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleActivateSubscription}
              disabled={activateSubscription.isPending}
            >
              {activateSubscription.isPending ? 'Ativando...' : 'Ativar Assinatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSubscriptionManager;
