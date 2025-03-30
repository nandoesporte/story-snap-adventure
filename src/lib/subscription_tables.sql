
-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  stories_limit INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  features JSONB DEFAULT '[]'::JSONB,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'pending', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  mercadopago_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription history table for auditing
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'canceled', 'renewed', 'failed')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Anyone can view active subscription plans'
  ) THEN
    CREATE POLICY "Anyone can view active subscription plans"
      ON subscription_plans FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE tablename = 'subscription_plans' 
    AND policyname = 'Admin users can manage subscription plans'
  ) THEN
    CREATE POLICY "Admin users can manage subscription plans"
      ON subscription_plans
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- User subscriptions policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Users can view their own subscriptions'
  ) THEN
    CREATE POLICY "Users can view their own subscriptions"
      ON user_subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE tablename = 'user_subscriptions' 
    AND policyname = 'Admin users can manage all subscriptions'
  ) THEN
    CREATE POLICY "Admin users can manage all subscriptions"
      ON user_subscriptions
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Subscription history policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE tablename = 'subscription_history' 
    AND policyname = 'Users can view their own subscription history'
  ) THEN
    CREATE POLICY "Users can view their own subscription history"
      ON subscription_history FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE tablename = 'subscription_history' 
    AND policyname = 'Admin users can view all subscription history'
  ) THEN
    CREATE POLICY "Admin users can view all subscription history"
      ON subscription_history FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Update the user_profiles table to add subscription-related fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES user_subscriptions(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stories_created_count INTEGER DEFAULT 0;

-- Create triggers to maintain stories_created_count
CREATE OR REPLACE FUNCTION update_stories_created_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET stories_created_count = (
    SELECT COUNT(*) FROM stories WHERE user_id = NEW.user_id
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist and recreate them
DROP TRIGGER IF EXISTS after_story_insert ON stories;
DROP TRIGGER IF EXISTS after_story_delete ON stories;

CREATE TRIGGER after_story_insert
AFTER INSERT ON stories
FOR EACH ROW
EXECUTE FUNCTION update_stories_created_count();

CREATE TRIGGER after_story_delete
AFTER DELETE ON stories
FOR EACH ROW
EXECUTE FUNCTION update_stories_created_count();

-- Add default subscription plans
INSERT INTO subscription_plans (name, description, price, interval, stories_limit, features)
VALUES 
('Básico', 'Acesso limitado a histórias infantis', 19.90, 'month', 5, '["Criação de 5 histórias por mês", "Acesso à biblioteca básica de personagens", "Download de histórias em PDF"]'::jsonb),
('Padrão', 'Para famílias que adoram histórias', 39.90, 'month', 15, '["Criação de 15 histórias por mês", "Acesso à biblioteca completa de personagens", "Download de histórias em PDF", "Narração de áudio"]'::jsonb),
('Premium', 'Experiência completa de histórias', 59.90, 'month', 50, '["Criação de histórias ilimitadas", "Acesso prioritário a novos recursos", "Personagens personalizados", "Narração de áudio premium", "Suporte prioritário"]'::jsonb)
ON CONFLICT DO NOTHING;
