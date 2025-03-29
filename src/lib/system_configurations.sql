

-- Create system configurations table
CREATE TABLE IF NOT EXISTS public.system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_system_configurations_timestamp ON public.system_configurations;

CREATE TRIGGER update_system_configurations_timestamp
BEFORE UPDATE ON public.system_configurations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Add RLS policies for admin access
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can do all operations" ON public.system_configurations;
CREATE POLICY "Admin users can do all operations" 
ON public.system_configurations
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.is_admin = true
  )
);

-- Add policy for reading non-sensitive configurations
DROP POLICY IF EXISTS "Allow reading non-sensitive configurations" ON public.system_configurations;
CREATE POLICY "Allow reading non-sensitive configurations" 
ON public.system_configurations
FOR SELECT
USING (
  key NOT IN ('stripe_api_key', 'stripe_webhook_secret', 'openai_api_key')
);

-- Grant access to the authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_configurations TO authenticated;

