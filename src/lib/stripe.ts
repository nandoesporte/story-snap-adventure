
import supabase from './supabase';

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
  stripe_price_id?: string;
  stripe_product_id?: string;
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

// Create a checkout session for a subscription
export async function createSubscriptionCheckout(userId: string, planId: string, returnUrl: string): Promise<string> {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { planId, returnUrl }
    });
    
    if (error) {
      console.error('Error creating checkout:', error);
      throw new Error('Falha ao criar sessão de pagamento');
    }
    
    return data.url;
  } catch (error) {
    console.error('Error in createSubscriptionCheckout:', error);
    throw error;
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { subscriptionId }
    });
    
    if (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Falha ao cancelar assinatura');
    }
    
    return data;
  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    throw error;
  }
}

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

// New function: Sync plans with Stripe
export async function syncPlansWithStripe(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
      body: { action: 'sync_plans' }
    });
    
    if (error) {
      console.error('Error syncing plans with Stripe:', error);
      throw new Error('Falha ao sincronizar planos com o Stripe');
    }
    
    return true;
  } catch (error) {
    console.error('Error in syncPlansWithStripe:', error);
    throw error;
  }
}

// New function: Get Stripe products
export async function getStripeProducts(): Promise<any[]> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
      body: { action: 'get_products' }
    });
    
    if (error) {
      console.error('Error getting Stripe products:', error);
      throw new Error('Falha ao buscar produtos do Stripe');
    }
    
    return data.products;
  } catch (error) {
    console.error('Error in getStripeProducts:', error);
    throw error;
  }
}

// New function: Get Stripe prices
export async function getStripePrices(): Promise<any[]> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
      body: { action: 'get_prices' }
    });
    
    if (error) {
      console.error('Error getting Stripe prices:', error);
      throw new Error('Falha ao buscar preços do Stripe');
    }
    
    return data.prices;
  } catch (error) {
    console.error('Error in getStripePrices:', error);
    throw error;
  }
}

// New function: Create a Stripe product and price
export async function createStripeProduct(productData: Partial<SubscriptionPlan>): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
      body: { 
        action: 'create_product',
        productData
      }
    });
    
    if (error) {
      console.error('Error creating Stripe product:', error);
      throw new Error('Falha ao criar produto no Stripe');
    }
    
    return data;
  } catch (error) {
    console.error('Error in createStripeProduct:', error);
    throw error;
  }
}

// New function: Update a Stripe product and price
export async function updateStripeProduct(productId: string, productData: Partial<SubscriptionPlan>): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-stripe-sync', {
      body: { 
        action: 'update_product',
        productId,
        productData
      }
    });
    
    if (error) {
      console.error('Error updating Stripe product:', error);
      throw new Error('Falha ao atualizar produto no Stripe');
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateStripeProduct:', error);
    throw error;
  }
}
