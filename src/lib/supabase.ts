
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { User, Session } from '@supabase/supabase-js';

// Import URL and key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://znumbovtprdnfddwwerf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudW1ib3Z0cHJkbmZkZHd3ZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDU4OTMsImV4cCI6MjA1ODIyMTg5M30.YiOKTKqRXruZsd3h2NRFCSJ9fWzAnrMFkSynBhdoBGI";

// Create supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export types
export type UserSession = {
  user: User | null;
  session: Session | null;
};

// Export useful functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getUser = async (): Promise<UserSession> => {
  try {
    // First, get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return { user: null, session: null };
    }
    
    if (!sessionData.session) {
      return { user: null, session: null };
    }
    
    // If we have a session, get the user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error fetching user:", userError);
      return { user: null, session: sessionData.session };
    }
    
    return {
      user: userData.user,
      session: sessionData.session
    };
  } catch (error) {
    console.error("Unexpected error in getUser:", error);
    return { user: null, session: null };
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
};

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session, error };
};

// Initialize database structure for admin users
export const initializeDatabaseStructure = async () => {
  try {
    const { checkTableExists } = await import('./dbHelpers');
    const tableExists = await checkTableExists('system_configurations');
    
    if (!tableExists) {
      // Call edge function to initialize database structure
      const { data, error } = await supabase.functions.invoke('initialize-database', {});
      
      if (error) {
        console.error("Error initializing database structure:", error);
        return { success: false, error };
      }
      
      return { success: true, data };
    }
    
    return { success: true, message: "Database structure already initialized" };
  } catch (error) {
    console.error("Unexpected error in initializeDatabaseStructure:", error);
    return { success: false, error };
  }
};

// Helper functions for stories
export const getUserStories = async (userId: string) => {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { stories: data, error };
};

export const deleteStory = async (storyId: string) => {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', storyId);
  
  return { error };
};

// Database Story type (matches DB schema)
export type DBStory = {
  id: string;
  title: string;
  pages: any; // JSON field
  character_name: string;
  character_age?: string;
  setting?: string;
  theme?: string;
  style?: string;
  cover_image_url?: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  voice_type?: string;
  character_prompt?: string;
};

// Application Story type (for using in the application)
export type Story = {
  id: string;
  title: string;
  content: string[]; // Parsed from pages
  character_name: string;
  character_age?: string;
  setting?: string;
  theme?: string;
  style?: string;
  cover_image_url?: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  voice_type?: string;
};

// Converter function to transform DB story to application Story
export const convertDBStoryToAppStory = (dbStory: DBStory): Story => {
  // Extract text content from pages JSON
  const content: string[] = [];
  
  if (Array.isArray(dbStory.pages)) {
    dbStory.pages.forEach((page: any) => {
      if (page && typeof page === 'object' && 'text' in page) {
        content.push(page.text);
      }
    });
  }
  
  return {
    id: dbStory.id,
    title: dbStory.title,
    content,
    character_name: dbStory.character_name,
    character_age: dbStory.character_age,
    setting: dbStory.setting,
    theme: dbStory.theme,
    style: dbStory.style,
    cover_image_url: dbStory.cover_image_url,
    is_public: dbStory.is_public,
    user_id: dbStory.user_id,
    created_at: dbStory.created_at,
    updated_at: dbStory.updated_at,
    voice_type: dbStory.voice_type
  };
};

export default supabase;
