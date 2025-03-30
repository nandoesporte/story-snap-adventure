
import { supabase } from './supabase';
import { verifyAsaasApiKey } from './asaas';

// Function to get available payment methods
export const getAvailablePaymentMethods = async (): Promise<{ mercadopago: boolean; asaas: boolean }> => {
  try {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('key, value')
      .in('key', ['mercadopago_enabled', 'mercadopago_access_token', 'asaas_enabled', 'asaas_api_key']);

    if (error) {
      console.error('Error fetching payment methods:', error);
      return { mercadopago: false, asaas: false };
    }

    // Convert to a more usable format
    const config: Record<string, string> = {};
    data.forEach(item => {
      config[item.key] = item.value;
    });

    // Check if Mercado Pago is enabled and configured
    const isMercadoPagoEnabled = config['mercadopago_enabled'] === 'true';
    const hasMercadoPagoToken = !!config['mercadopago_access_token'];
    const mercadoPagoAvailable = isMercadoPagoEnabled && hasMercadoPagoToken;

    // Check if Asaas is enabled and configured
    const isAsaasEnabled = config['asaas_enabled'] === 'true';
    const hasAsaasKey = !!config['asaas_api_key'];
    const asaasAvailable = isAsaasEnabled && hasAsaasKey;

    return {
      mercadopago: mercadoPagoAvailable,
      asaas: asaasAvailable
    };
  } catch (error) {
    console.error('Error checking payment methods:', error);
    return { mercadopago: false, asaas: false };
  }
};

// Type for subscription plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stories_limit: number;
  features: string[];
  is_active: boolean;
}

// Get all active subscription plans
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    throw error;
  }
};

// Check if a user has an active subscription
export const checkUserSubscription = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        subscription_plan_id,
        status,
        current_period_start,
        current_period_end,
        subscription_plans (
          id,
          name,
          price,
          currency,
          interval,
          stories_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found, this is not an error
        return null;
      }
      console.error('Error checking user subscription:', error);
      throw error;
    }

    // Check if subscription is still active based on current_period_end
    if (data) {
      const now = new Date();
      const periodEnd = new Date(data.current_period_end);
      
      if (periodEnd < now) {
        // Subscription has expired
        // Update the subscription status to inactive
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'inactive' })
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Error updating expired subscription:', updateError);
        }
        
        return null;
      }
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error in checkUserSubscription:', error);
    throw error;
  }
};

// Function to create a Mercado Pago checkout
export const createMercadoPagoCheckout = async (userId: string, planId: string, returnUrl: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('create-mercadopago-checkout', {
      body: {
        user_id: userId,
        plan_id: planId,
        return_url: returnUrl,
      },
    });

    if (error) {
      console.error('Error invoking create-mercadopago-checkout function:', error);
      throw new Error('Não foi possível criar o checkout do Mercado Pago: ' + error.message);
    }

    if (!data || !data.url) {
      throw new Error('Resposta inválida do servidor de pagamento do Mercado Pago');
    }

    return data.url;
  } catch (error) {
    console.error('Error creating Mercado Pago checkout:', error);
    throw error;
  }
};
