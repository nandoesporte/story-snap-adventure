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
        subscription_plans(*)
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
    
    // Call the edge function with error handling
    const { data, error } = await supabase.functions.invoke('create-mercadopago-checkout', {
      body: { userId, planId, returnUrl }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Erro na função de checkout: ${error.message || error}`);
    }
    
    if (!data) {
      console.error('No data received from function');
      throw new Error('Não foi recebida resposta do servidor de pagamento');
    }
    
    if (data.error) {
      console.error('Error from payment server:', data.error);
      throw new Error(`Erro no servidor de pagamento: ${data.error}`);
    }
    
    if (!data.checkoutUrl) {
      console.error('Invalid response from payment server:', data);
      throw new Error('URL de checkout não retornada pelo servidor de pagamento');
    }

    console.log('MercadoPago checkout URL generated:', data.checkoutUrl);
    return data.checkoutUrl;
  } catch (error) {
    console.error('Error creating MercadoPago checkout:', error);
    throw error;
  }
};

// Function to check if a user can create more stories based on their subscription
export const canCreateStory = async (userId: string) => {
  try {
    // Get user subscription first
    const subscription = await checkUserSubscription(userId);
    
    // If user has an active subscription
    if (subscription) {
      // Get stories created count from user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('stories_created_count')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      const storiesCreated = profileData?.stories_created_count || 0;
      const storiesLimit = subscription.subscription_plans?.stories_limit || 0;
      
      return {
        canCreate: storiesCreated < storiesLimit,
        remaining: Math.max(0, storiesLimit - storiesCreated),
        subscription: subscription,
        reason: storiesCreated >= storiesLimit ? 'Você atingiu o limite de histórias do seu plano para este período.' : null
      };
    } else {
      // If no subscription, check free credits
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('story_credits')
        .eq('id', userId)
        .single();
        
      if (profileError) throw profileError;
      
      const freeCredits = userProfile?.story_credits || 0;
      
      return {
        canCreate: freeCredits > 0,
        remaining: freeCredits,
        subscription: null,
        reason: freeCredits <= 0 ? 'Você não possui créditos gratuitos disponíveis. Adquira um plano para continuar criando histórias.' : null
      };
    }
  } catch (error) {
    console.error('Error checking if user can create story:', error);
    // Default to allowing creation to avoid blocking users unexpectedly
    return { 
      canCreate: true, 
      remaining: 1, 
      subscription: null,
      reason: null
    };
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

// Consume a story credit when a user creates a story
export const consumeStoryCredit = async (userId: string) => {
  try {
    // First, check if user has an active subscription
    const subscription = await checkUserSubscription(userId);
    
    if (subscription) {
      // Increment the stories_created_count in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ stories_created_count: supabase.rpc('increment', { row_id: userId, amount: 1 }) })
        .eq('id', userId);
      
      if (error) {
        console.error('Error incrementing stories count:', error);
        return false;
      }
      
      return true;
    } else {
      // If no subscription, deduct from free credits
      const { data, error } = await supabase.rpc('deduct_user_credits', {
        user_uuid: userId,
        amount: 1,
        description: 'História criada'
      });
      
      if (error) {
        console.error('Error consuming story credit:', error);
        return false;
      }
      
      return data || false;
    }
  } catch (error) {
    console.error('Error in consumeStoryCredit:', error);
    return false;
  }
};
