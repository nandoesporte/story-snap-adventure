
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = 'https://znumbovtprdnfddwwerf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudW1ib3Z0cHJkbmZkZHd3ZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDU4OTMsImV4cCI6MjA1ODIyMTg5M30.YiOKTKqRXruZsd3h2NRFCSJ9fWzAnrMFkSynBhdoBGI';

// Create a single instance of the supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export type UserSession = {
  user: User | null;
  session: any | null;
};

// Helper functions for authentication
export const getUser = async (): Promise<UserSession> => {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error fetching user session:', sessionError.message);
      return { user: null, session: null };
    }
    
    if (!sessionData.session) {
      console.log('No active session found');
      return { user: null, session: null };
    }
    
    // Get the user data if there's an active session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user data:', userError.message);
      return { user: null, session: sessionData.session };
    }
    
    console.log('getUser returned:', userData.user);
    return { user: userData.user, session: sessionData.session };
  } catch (error) {
    console.error('Unexpected error in getUser:', error);
    return { user: null, session: null };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log('supabase.ts: signInWithEmail', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('signInWithEmail error:', error);
    throw error;
  }
  
  console.log('signInWithEmail success:', data);
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  console.log('supabase.ts: signUpWithEmail', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.error('signUpWithEmail error:', error);
    throw error;
  }
  
  console.log('signUpWithEmail success:', data);
  return data;
};

export const signOut = async () => {
  console.log('supabase.ts: signOut');
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('signOut error:', error);
    throw error;
  }
  console.log('signOut success');
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

// Admin operations
export const makeUserAdmin = async (email: string) => {
  console.log('Making user admin:', email);
  try {
    // First, check if the user exists by querying auth.users view or custom profiles table
    // This will depend on how you've set up your database
    const { data: userData, error: userError } = await supabase
      .from('profiles')  // or 'users' depending on your schema
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      // Try a different approach if the first one fails
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
      if (usersError || !usersData) {
        console.error('Error finding user in users table:', usersError);
        throw new Error('User not found');
      }
      
      console.log('Found user in users table:', usersData);
      
      // Update the user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ is_admin: true })
        .eq('id', usersData.id);
      
      if (updateError) {
        console.error('Error updating user_profiles:', updateError);
        throw updateError;
      }
    } else {
      console.log('Found user in profiles table:', userData);
      
      // Update the profiles table with admin privileges
      const { error: updateError } = await supabase
        .from('profiles')  // or 'user_profiles' depending on your schema
        .update({ is_admin: true })
        .eq('id', userData.id);
      
      if (updateError) {
        console.error('Error updating profiles:', updateError);
        throw updateError;
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('makeUserAdmin error:', error);
    throw new Error(`Failed to make user admin: ${error.message}`);
  }
};

// Reference to the SQL setup file
// The SQL setup is now in src/lib/supabase-setup.sql
export const getSupabaseSetupSQL = () => {
  return import.meta.glob('./supabase-setup.sql', { as: 'raw', eager: true })['./supabase-setup.sql'];
};
