import { supabase } from './supabase';

export async function runStripeColumnsMigration() {
  // Keep Stripe columns for backward compatibility with existing data
  try {
    const { error } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          -- Run add_stripe_columns.sql content
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'subscription_plans' AND column_name = 'stripe_product_id'
            ) THEN
              ALTER TABLE subscription_plans ADD COLUMN stripe_product_id TEXT;
            END IF;
          END
          $$;

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id'
            ) THEN
              ALTER TABLE subscription_plans ADD COLUMN stripe_price_id TEXT;
            END IF;
          END
          $$;
        `
      });

    if (error) {
      console.error('Error running Stripe columns migration:', error);
      return false;
    }

    console.log('Stripe columns migration completed successfully');
    return true;
  } catch (err) {
    console.error('Exception running Stripe columns migration:', err);
    return false;
  }
}
