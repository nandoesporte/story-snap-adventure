
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = 'https://znumbovtprdnfddwwerf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudW1ib3Z0cHJkbmZkZHd3ZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDU4OTMsImV4cCI6MjA1ODIyMTg5M30.YiOKTKqRXruZsd3h2NRFCSJ9fWzAnrMFkSynBhdoBGI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export type UserSession = {
  user: User | null;
  session: any | null;
};

// Helper functions for authentication
export const getUser = async (): Promise<UserSession> => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error fetching user:', error.message);
    return { user: null, session: null };
  }
  
  // Get the user data separately
  const { data: { user } } = await supabase.auth.getUser();
  
  return { user, session: data.session };
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper for stories database operations
export type Story = {
  id?: string;
  user_id?: string;
  title: string;
  cover_image_url: string;
  character_name: string;
  character_age: string;
  theme: string;
  setting: string;
  style: string;
  pages: StoryPage[];
  created_at?: string;
};

export type StoryPage = {
  text: string;
  image_url: string;
};

export const saveStory = async (story: Story) => {
  const { data, error } = await supabase
    .from('stories')
    .insert([{
      user_id: (await getUser()).user?.id,
      title: story.title,
      cover_image_url: story.cover_image_url,
      character_name: story.character_name,
      character_age: story.character_age,
      theme: story.theme,
      setting: story.setting,
      style: story.style,
      pages: story.pages,
    }])
    .select();
  
  if (error) throw error;
  return data;
};

export const getUserStories = async () => {
  const user = (await getUser()).user;
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getStoryById = async (id: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteStory = async (id: string) => {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Admin functions
export const updateStory = async (id: string, updates: Partial<Story>) => {
  const { data, error } = await supabase
    .from('stories')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const getAllStories = async () => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// SQL setup for Supabase (this is not executed, just for reference)
export const supabaseSetupSQL = `
-- Create tables for the admin panel and app

-- Create themes table
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow authenticated users to read themes
CREATE POLICY "Allow authenticated users to read themes"
  ON themes
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
  ON settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to manage themes
CREATE POLICY "Allow admin users to manage themes"
  ON themes
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@example.com')
    )
  );

-- Allow admin users to manage settings
CREATE POLICY "Allow admin users to manage settings"
  ON settings
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@example.com')
    )
  );

-- Insert default themes
INSERT INTO themes (name, description) VALUES
('Aventura', 'Histórias de aventura com muita ação e exploração'),
('Fantasia', 'Histórias mágicas em mundos fantásticos'),
('Educacional', 'Histórias com foco em ensinar conceitos e valores'),
('Amizade', 'Histórias sobre amizade e relacionamentos'),
('Natureza', 'Histórias sobre animais e o mundo natural');

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('allow_story_sharing', 'true', 'Permitir compartilhamento de histórias'),
('max_stories_per_user', '10', 'Número máximo de histórias por usuário'),
('default_theme', 'Aventura', 'Tema padrão para novas histórias'),
('enable_ai_features', 'true', 'Habilitar recursos de IA');
`;
