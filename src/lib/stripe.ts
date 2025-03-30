
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Get available payment methods from system configurations
export const getAvailablePaymentMethods = async () => {
  try {
    // Check for mercadopago_enabled flag first
    const { data: mpEnabledConfig, error: mpEnabledError } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'mercadopago_enabled')
      .single();
    
    // Check for API key as a fallback
    const { data: mercadopagoConfig, error: mpError } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'mercadopago_access_token')
      .single();
    
    // If mercadopago_enabled is explicitly false, return false regardless of API key
    if (mpEnabledConfig && mpEnabledConfig.value === 'false') {
      console.log('Mercado Pago disabled by configuration flag');
      return { mercadopago: false };
    }
    
    // Otherwise check if API key exists and is non-empty
    const hasMercadoPago = mercadopagoConfig?.value && mercadopagoConfig.value.length > 0;
    
    console.log('Mercado Pago available:', hasMercadoPago);
    
    return {
      mercadopago: hasMercadoPago,
    };
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return { mercadopago: false };
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
    console.log(`Creating MercadoPago checkout for user: ${userId}, plan: ${planId}`);
    
    // First verify the payment method is available
    const paymentMethods = await getAvailablePaymentMethods();
    if (!paymentMethods.mercadopago) {
      throw new Error('Método de pagamento Mercado Pago não está disponível ou configurado');
    }
    
    const { data, error } = await supabase.functions.invoke('create-mercadopago-checkout', {
      body: { userId, planId, returnUrl }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Erro na função de checkout: ${error.message}`);
    }
    
    if (!data) {
      console.error('No data received from function');
      throw new Error('Não foi recebida resposta do servidor de pagamento');
    }
    
    if (!data.checkoutUrl) {
      console.error('Invalid response from payment server:', data);
      throw new Error('URL de checkout não retornada pelo servidor de pagamento');
    }

    console.log('MercadoPago checkout URL generated:', data.checkoutUrl);
    return data.checkoutUrl;
  } catch (error) {
    console.error('Error creating MercadoPago checkout:', error);
    throw new Error(`Não foi possível criar a sessão de pagamento: ${error.message}`);
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
