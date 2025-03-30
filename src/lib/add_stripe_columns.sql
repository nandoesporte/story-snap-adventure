
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
