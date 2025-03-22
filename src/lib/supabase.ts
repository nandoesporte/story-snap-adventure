
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = 'https://znumbovtprdnfddwwerf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudW1ib3Z0cHJkbmZkZHd3ZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDU4OTMsImV4cCI6MjA1ODIyMTg5M30.YiOKTKqRXruZsd3h2NRFCSJ9fWzAnrMFkSynBhdoBGI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize necessary database structure
export const initializeDatabaseStructure = async () => {
  // Create stored procedures for creating tables if they don't exist
  const { error: procError } = await supabase.rpc('create_functions_if_not_exists');
  
  if (procError) {
    console.error("Error creating database functions:", procError);
    
    // Fallback: create the functions directly
    const { error } = await supabase.sql(`
      -- Create function to create page_contents table if it doesn't exist
      CREATE OR REPLACE FUNCTION public.create_page_contents_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.page_contents (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          page TEXT NOT NULL,
          section TEXT NOT NULL,
          key TEXT NOT NULL,
          content TEXT,
          content_type TEXT DEFAULT 'text',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(page, section, key)
        );
        
        -- Create RLS policies
        ALTER TABLE public.page_contents ENABLE ROW LEVEL SECURITY;
        
        -- Drop policies if they exist to avoid errors
        DROP POLICY IF EXISTS "Public can view page_contents" ON public.page_contents;
        DROP POLICY IF EXISTS "Authenticated users can insert page_contents" ON public.page_contents;
        DROP POLICY IF EXISTS "Admins can update page_contents" ON public.page_contents;
        DROP POLICY IF EXISTS "Admins can delete page_contents" ON public.page_contents;
        
        -- Create policies
        CREATE POLICY "Public can view page_contents" 
          ON public.page_contents FOR SELECT USING (true);
          
        CREATE POLICY "Authenticated users can insert page_contents" 
          ON public.page_contents FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');
          
        CREATE POLICY "Admins can update page_contents" 
          ON public.page_contents FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() AND up.is_admin = true
            ) OR auth.email() = 'nandoesporte1@gmail.com'
          );
          
        CREATE POLICY "Admins can delete page_contents" 
          ON public.page_contents FOR DELETE 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() AND up.is_admin = true
            ) OR auth.email() = 'nandoesporte1@gmail.com'
          );
      END;
      $$;

      -- Create function to create user_profiles table if it doesn't exist
      CREATE OR REPLACE FUNCTION public.create_user_profiles_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT,
          avatar_url TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        -- Create RLS policies
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Drop policies if they exist to avoid errors
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
        
        -- Create policies
        CREATE POLICY "Users can view their own profile" 
          ON public.user_profiles FOR SELECT 
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Users can update their own profile" 
          ON public.user_profiles FOR UPDATE 
          USING (auth.uid() = user_id);
          
        CREATE POLICY "Admins can view all profiles" 
          ON public.user_profiles FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() AND up.is_admin = true
            ) OR auth.email() = 'nandoesporte1@gmail.com'
          );
          
        CREATE POLICY "Admins can update all profiles" 
          ON public.user_profiles FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM public.user_profiles up 
              WHERE up.user_id = auth.uid() AND up.is_admin = true
            ) OR auth.email() = 'nandoesporte1@gmail.com'
          );
      END;
      $$;

      -- Create function that creates both functions if they don't exist
      CREATE OR REPLACE FUNCTION public.create_functions_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- Ensure uuid-ossp extension is available
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        -- Call the individual functions
        PERFORM public.create_page_contents_if_not_exists();
        PERFORM public.create_user_profiles_if_not_exists();
      END;
      $$;
    `);
    
    if (error) {
      console.error("Error creating database structure:", error);
    }
  }
  
  // Run the stored procedures
  await supabase.rpc('create_page_contents_if_not_exists');
  await supabase.rpc('create_user_profiles_if_not_exists');
  
  // Run the SQL script to insert initial data
  try {
    const { error } = await supabase.sql(`
      -- Insert initial data for page_contents if it doesn't exist
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'page_contents') THEN
          -- Insert data only if table is empty
          IF NOT EXISTS (SELECT 1 FROM public.page_contents LIMIT 1) THEN
            ${getSupabaseSetupSQL()}
          END IF;
        END IF;
      END $$;
    `);
    
    if (error) {
      console.error("Error inserting initial data:", error);
    }
  } catch (err) {
    console.error("Error running setup SQL:", err);
  }
};

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

// Reference to the SQL setup file
// The SQL setup is now in src/lib/supabase-setup.sql
export const getSupabaseSetupSQL = () => {
  try {
    return import.meta.glob('./update_page_contents.sql', { as: 'raw', eager: true })['./update_page_contents.sql'];
  } catch (e) {
    console.error("Error loading SQL file:", e);
    return "";
  }
};

// Initialize the database structure when the module is imported
initializeDatabaseStructure().catch(console.error);

