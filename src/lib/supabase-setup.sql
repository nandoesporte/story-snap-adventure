-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users extension table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'pt-BR',
  story_credits INTEGER DEFAULT 5,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  character_name TEXT NOT NULL,
  character_age TEXT,
  theme TEXT,
  setting TEXT,
  style TEXT,
  pages JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create themes table
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story_likes table for tracking user likes
CREATE TABLE story_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, story_id)
);

-- Create story_views table for tracking story views
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_theme_preferences table
CREATE TABLE user_theme_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, theme_id)
);

-- Create story_credits_transactions table for tracking credit usage
CREATE TABLE story_credits_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_theme_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_credits_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Everyone can view admin profiles"
  ON user_profiles FOR SELECT
  USING (true);

-- Stories policies
CREATE POLICY "Users can view their own stories"
  ON stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public stories"
  ON stories FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can manage all stories"
  ON stories
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Themes policies
CREATE POLICY "Anyone can view active themes"
  ON themes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin users can manage themes"
  ON themes
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Settings policies
CREATE POLICY "Anyone can view public settings"
  ON settings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Admin users can manage settings"
  ON settings
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Story likes policies
CREATE POLICY "Users can like stories"
  ON story_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own likes"
  ON story_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON story_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can register views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own views"
  ON story_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authors can see views on their stories"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- User theme preferences policies
CREATE POLICY "Users can manage their theme preferences"
  ON user_theme_preferences
  USING (auth.uid() = user_id);

-- Story credits policies
CREATE POLICY "Users can view their own credit transactions"
  ON story_credits_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin users can manage all credit transactions"
  ON story_credits_transactions
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Insert default themes
INSERT INTO themes (name, description, image_url) VALUES
('Aventura', 'Histórias de aventura com muita ação e exploração', 'https://example.com/images/adventure.jpg'),
('Fantasia', 'Histórias mágicas em mundos fantásticos', 'https://example.com/images/fantasy.jpg'),
('Educacional', 'Histórias com foco em ensinar conceitos e valores', 'https://example.com/images/educational.jpg'),
('Amizade', 'Histórias sobre amizade e relacionamentos', 'https://example.com/images/friendship.jpg'),
('Natureza', 'Histórias sobre animais e o mundo natural', 'https://example.com/images/nature.jpg'),
('Ficção Científica', 'Histórias ambientadas no futuro ou com tecnologia avançada', 'https://example.com/images/scifi.jpg'),
('Mistério', 'Histórias com enigmas e mistérios para resolver', 'https://example.com/images/mystery.jpg'),
('Fábulas', 'Histórias curtas com lições de moral', 'https://example.com/images/fables.jpg');

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('allow_story_sharing', 'true', 'Permitir compartilhamento de histórias'),
('max_stories_per_user', '10', 'Número máximo de histórias por usuário'),
('default_theme', 'Aventura', 'Tema padrão para novas histórias'),
('enable_ai_features', 'true', 'Habilitar recursos de IA'),
('story_creation_cost', '1', 'Custo em créditos para criar uma história'),
('allow_public_registration', 'true', 'Permitir registro público de novos usuários'),
('maintenance_mode', 'false', 'Sistema em modo de manutenção'),
('default_language', 'pt-BR', 'Idioma padrão do sistema');

-- Functions

-- Function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (new.id, new.email, 'https://example.com/default-avatar.png');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to check if a user has enough credits
CREATE OR REPLACE FUNCTION check_user_credits(user_uuid UUID, required_credits INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  available_credits INTEGER;
BEGIN
  SELECT story_credits INTO available_credits
  FROM user_profiles
  WHERE id = user_uuid;
  
  RETURN available_credits >= required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits from a user
CREATE OR REPLACE FUNCTION deduct_user_credits(user_uuid UUID, amount INTEGER, description TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN;
BEGIN
  -- Update the user's credits
  UPDATE user_profiles
  SET story_credits = story_credits - amount
  WHERE id = user_uuid
  AND story_credits >= amount;
  
  -- Check if the update was successful
  IF FOUND THEN
    -- Record the transaction
    INSERT INTO story_credits_transactions (user_id, amount, description, transaction_type)
    VALUES (user_uuid, amount, description, 'debit');
    success := TRUE;
  ELSE
    success := FALSE;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to a user
CREATE OR REPLACE FUNCTION add_user_credits(user_uuid UUID, amount INTEGER, description TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the user's credits
  UPDATE user_profiles
  SET story_credits = story_credits + amount
  WHERE id = user_uuid;
  
  -- Record the transaction
  INSERT INTO story_credits_transactions (user_id, amount, description, transaction_type)
  VALUES (user_uuid, amount, description, 'credit');
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set is_admin=true for nandoesporte1@gmail.com
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'nandoesporte1@gmail.com';
  
  IF user_id IS NOT NULL THEN
    INSERT INTO user_profiles (id, is_admin, display_name)
    VALUES (user_id, true, 'Admin User')
    ON CONFLICT (id) DO UPDATE
    SET is_admin = true;
  END IF;
END $$;
