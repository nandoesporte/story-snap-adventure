
import { supabase } from './supabase';

export async function runStripeColumnsMigration() {
  try {
    // Read the migration SQL file content
    const migrationSQL = `
    -- Add the stripe_product_id column to subscription_plans if it doesn't exist
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

    -- Add the stripe_price_id column to subscription_plans if it doesn't exist
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
    `;

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });
    
    if (error) {
      console.error('Error running stripe columns migration:', error);
      return false;
    }
    
    console.log('Stripe columns migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error in runStripeColumnsMigration:', error);
    return false;
  }
}
