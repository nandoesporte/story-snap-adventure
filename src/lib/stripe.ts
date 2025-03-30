
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Get available payment methods from system configurations
export const getAvailablePaymentMethods = async () => {
  try {
    const { data: mercadopagoConfig, error: mpError } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'mercadopago_api_key')
      .single();

    const { data: asaasConfig, error: asaasError } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'asaas_api_key')
      .single();

    return {
      mercadopago: mercadopagoConfig?.value && mercadopagoConfig.value.length > 0,
      asaas: asaasConfig?.value && asaasConfig.value.length > 0,
    };
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return { mercadopago: false, asaas: false };
  }
};

// Get all subscription plans
export const getSubscriptionPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Check if a user has an active subscription
export const checkUserSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if no subscription exists
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error checking user subscription:', error);
    throw error;
  }
};

// Create a MercadoPago checkout session
export const createMercadoPagoCheckout = async (userId: string, planId: string, returnUrl: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-mercadopago-checkout', {
      body: { userId, planId, returnUrl }
    });

    if (error) throw error;
    
    if (!data || !data.checkoutUrl) {
      throw new Error('Resposta inválida do servidor de pagamento');
    }

    return data.checkoutUrl;
  } catch (error) {
    console.error('Error creating MercadoPago checkout:', error);
    throw new Error('Não foi possível criar a sessão de pagamento');
  }
};

// Function to check if a user can create more stories based on their subscription
export const canCreateStory = async (userId: string) => {
  try {
    // Get user subscription
    const subscription = await checkUserSubscription(userId);
    
    // If no subscription, check if they have free stories left
    if (!subscription) {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('story_credits')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      // If they have story credits, they can create a story
      return {
        canCreate: (userProfile?.story_credits || 0) > 0,
        remaining: userProfile?.story_credits || 0,
        subscription: null
      };
    }
    
    // Get stories created this billing period
    const periodStart = new Date(subscription.current_period_start);
    
    const { count, error: countError } = await supabase
      .from('stories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());
      
    if (countError) throw countError;
    
    const storiesCreated = count || 0;
    const storiesLimit = subscription.subscription_plans.stories_limit;
    
    return {
      canCreate: storiesCreated < storiesLimit,
      remaining: Math.max(0, storiesLimit - storiesCreated),
      subscription: subscription
    };
  } catch (error) {
    console.error('Error checking if user can create story:', error);
    // Default to allowing creation to avoid blocking users
    return { canCreate: true, remaining: 1, subscription: null };
  }
};

// Cancel a subscription
export const cancelSubscription = async (subscriptionId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { subscriptionId }
    });

    if (error) throw error;
    
    if (data.success) {
      toast.success('Assinatura cancelada com sucesso');
      return true;
    } else {
      toast.error(data.message || 'Não foi possível cancelar a assinatura');
      return false;
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    toast.error('Ocorreu um erro ao cancelar a assinatura');
    return false;
  }
};
