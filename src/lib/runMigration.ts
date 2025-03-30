
import { supabase } from '@/integrations/supabase/client';

// Run SQL migrations for Stripe columns
export const runStripeColumnsMigration = async () => {
  try {
    const stripeColumnsSQL = `
    -- Check if stripe columns exist and add them if they don't
    DO $$
    BEGIN
      -- Check and add stripe_product_id to subscription_plans if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' AND column_name = 'stripe_product_id'
      ) THEN
        ALTER TABLE subscription_plans ADD COLUMN stripe_product_id TEXT;
      END IF;

      -- Check and add stripe_price_id to subscription_plans if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id'
      ) THEN
        ALTER TABLE subscription_plans ADD COLUMN stripe_price_id TEXT;
      END IF;

      -- Check and add stripe_subscription_id to user_subscriptions if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_subscription_id'
      ) THEN
        ALTER TABLE user_subscriptions ADD COLUMN stripe_subscription_id TEXT;
      END IF;

      -- Check and add stripe_customer_id to user_subscriptions if it doesn't exist
      IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_customer_id'
      ) THEN
        ALTER TABLE user_subscriptions ADD COLUMN stripe_customer_id TEXT;
      END IF;
    END
    $$;
    `;
    
    // Call the initialize-database function to run the script
    const { data, error } = await supabase.functions.invoke('initialize-database', {
      body: { script: stripeColumnsSQL }
    });
    
    if (error) {
      console.error('Error running Stripe columns migration:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error running migration:', error);
    return false;
  }
};
