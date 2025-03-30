
import { supabase } from './supabase';

// Define types for subscription plan and user subscription
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stories_limit: number;
  is_active: boolean;
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans: SubscriptionPlan;
}

// Check if user has a valid subscription
export async function checkUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        subscription_plans:plan_id(
          id,
          name,
          price,
          interval,
          stories_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error checking subscription:', error);
      return null;
    }

    // Check if subscription is still valid
    if (data) {
      const currentTime = new Date().getTime();
      const periodEnd = new Date(data.current_period_end).getTime();
      
      if (currentTime > periodEnd) {
        // Subscription expired, should be updated by webhook but just in case
        return null;
      }
      
      return data as unknown as UserSubscription;
    }
    
    return null;
  } catch (error) {
    console.error('Error in checkUserSubscription:', error);
    return null;
  }
}

// Check if user has reached the story limit for their subscription
export async function checkStoryLimitReached(userId: string) {
  try {
    // Get user's active subscription
    const subscription = await checkUserSubscription(userId);
    
    if (!subscription) {
      // No active subscription, check if they are within the free tier limit
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('stories_created_count, story_credits')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.error('Error checking user profile:', profileError);
        return true; // Fail safe - assume limit reached
      }
      
      // Check if user still has free credits
      return profile.story_credits <= 0;
    }
    
    // User has subscription, check if they've reached their plan limit
    const storiesLimit = subscription.subscription_plans.stories_limit;
    
    // Get count of stories created this billing period
    const periodStart = new Date(subscription.current_period_start);
    
    const { count, error } = await supabase
      .from('stories')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', periodStart.toISOString());
      
    if (error) {
      console.error('Error checking story count:', error);
      return true; // Fail safe - assume limit reached
    }
    
    return count >= storiesLimit;
  } catch (error) {
    console.error('Error in checkStoryLimitReached:', error);
    return true; // Fail safe - assume limit reached
  }
}

// Get available payment methods
export async function getAvailablePaymentMethods() {
  try {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('key, value')
      .in('key', ['mercadopago_enabled']);
    
    if (error) {
      console.error('Error fetching payment methods:', error);
      return { stripe: false, mercadopago: false }; // Default to none if error
    }
    
    const methods = {
      stripe: false, // Default to false now that we've removed Stripe
      mercadopago: false
    };
    
    data?.forEach(item => {
      if (item.key === 'mercadopago_enabled') {
        methods.mercadopago = item.value === 'true';
      }
    });
    
    return methods;
  } catch (error) {
    console.error('Error in getAvailablePaymentMethods:', error);
    return { stripe: false, mercadopago: false }; // Default to none if error
  }
}

// Creates a MercadoPago checkout session
export const createMercadoPagoCheckout = async (
  userId: string,
  planId: string,
  returnUrl?: string
): Promise<string> => {
  try {
    console.log(`Creating MercadoPago checkout for ${userId} ${planId}`);
    
    // Make the request to the Edge Function with proper error handling
    let response;
    try {
      response = await supabase.functions.invoke('create-mercadopago-checkout', {
        method: 'POST',
        body: { planId, returnUrl },
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (fetchError) {
      console.error("Erro ao criar checkout do MercadoPago:", fetchError);
      throw new Error("Não foi possível conectar ao servidor do MercadoPago. Verifique sua conexão de internet ou se o serviço está disponível.");
    }
    
    if (!response || response.error) {
      console.error("Erro em createMercadoPagoCheckout:", response?.error || "Resposta vazia");
      
      // Get a more descriptive error message if available
      let errorMessage = "Erro desconhecido ao processar pagamento.";
      if (response?.error) {
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (response.error.message) {
          errorMessage = response.error.message;
        } else if (response.error.details) {
          errorMessage = response.error.details;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = response.data;
    
    if (!data || !data.url) {
      console.error("Resposta inválida do MercadoPago:", data);
      throw new Error("A resposta do servidor do MercadoPago foi inválida.");
    }
    
    return data.url;
  } catch (error) {
    console.error("Erro em createMercadoPagoCheckout:", error);
    throw error;
  }
};

// Get subscription plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
      
    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw new Error('Falha ao buscar planos de assinatura');
    }
    
    return data as SubscriptionPlan[];
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    throw error;
  }
}

// Verify a subscription is active (for protected routes)
export async function verifyActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await checkUserSubscription(userId);
    return !!subscription && subscription.status === 'active';
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return false;
  }
}
