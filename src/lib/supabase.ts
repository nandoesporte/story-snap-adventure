
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://znumbovtprdnfddwwerf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudW1ib3Z0cHJkbmZkZHd3ZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDU4OTMsImV4cCI6MjA1ODIyMTg5M30.YiOKTKqRXruZsd3h2NRFCSJ9fWzAnrMFkSynBhdoBGI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export type UserSession = {
  user: {
    id: string;
    email: string;
  } | null;
  session: any | null;
};

// Helper functions for authentication
export const getUser = async () => {
  const { data: { user, session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error fetching user:', error.message);
    return { user: null, session: null };
  }
  
  return { user, session };
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
    .eq('user_id', user.id)
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
