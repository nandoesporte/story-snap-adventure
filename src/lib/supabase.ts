import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = 'https://znumbovtprdnfddwwerf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudW1ib3Z0cHJkbmZkZHd3ZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDU4OTMsImV4cCI6MjA1ODIyMTg5M30.YiOKTKqRXruZsd3h2NRFCSJ9fWzAnrMFkSynBhdoBGI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize necessary database structure
export const initializeDatabaseStructure = async () => {
  try {
    // Create the functions if they don't exist by calling stored procedures
    console.log("Initializing database structure...");
    
    // Try to call existing functions to create tables if they don't exist
    try {
      const { error: pageContentsError } = await supabase.rpc('create_page_contents_if_not_exists');
      if (pageContentsError) {
        console.warn("Error creating page_contents table:", pageContentsError);
      }
    } catch (err) {
      console.warn("create_page_contents_if_not_exists function may not exist yet:", err);
    }
    
    try {
      const { error: userProfilesError } = await supabase.rpc('create_user_profiles_if_not_exists');
      if (userProfilesError) {
        console.warn("Error creating user_profiles table:", userProfilesError);
      }
    } catch (err) {
      console.warn("create_user_profiles_if_not_exists function may not exist yet:", err);
    }
    
    // Fallback: Try to ensure tables exist by querying them
    console.log("Checking if tables already exist...");
    
    // Check if page_contents table exists
    const { error: pageContentsCheckError } = await supabase
      .from('page_contents')
      .select('count(*)', { count: 'exact', head: true });
      
    if (pageContentsCheckError && pageContentsCheckError.code === '42P01') {
      console.log("Page contents table doesn't exist. Please create it in the Supabase dashboard.");
      // We can't create tables directly from client-side code
      // User needs to run SQL in the Supabase dashboard
    }
    
    // Check if user_profiles table exists
    const { error: userProfilesCheckError } = await supabase
      .from('user_profiles')
      .select('count(*)', { count: 'exact', head: true });
      
    if (userProfilesCheckError && userProfilesCheckError.code === '42P01') {
      console.log("User profiles table doesn't exist. Please create it in the Supabase dashboard.");
      // We can't create tables directly from client-side code
      // User needs to run SQL in the Supabase dashboard
    }
    
    // Try to seed initial data if page_contents table exists
    if (!pageContentsCheckError) {
      // Check if table is empty
      const { count, error: countError } = await supabase
        .from('page_contents')
        .select('*', { count: 'exact', head: true });
        
      if (!countError && count === 0) {
        console.log("Page contents table is empty, seeding initial data...");
        
        // Insert some initial data
        const initialData = getInitialPageContents();
        
        for (const item of initialData) {
          const { error: insertError } = await supabase
            .from('page_contents')
            .insert(item);
            
          if (insertError) {
            console.error("Error inserting initial data:", insertError);
          }
        }
      }
      
      // Update the hero image regardless
      await updateHeroImage();
    }
    
    console.log("Database structure initialization completed");
  } catch (err) {
    console.error("Error initializing database structure:", err);
  }
};

// Get initial page contents data
const getInitialPageContents = () => {
  return [
    {
      page: 'index',
      section: 'hero',
      key: 'title',
      content: 'Histórias infantis personalizadas em minutos',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'hero',
      key: 'subtitle',
      content: 'Crie histórias mágicas com os personagens e cenários que seu filho adora',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'title',
      content: 'Como funciona',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'subtitle',
      content: 'Crie histórias únicas em apenas 3 passos simples',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'feature1_title',
      content: 'Personalize sua história',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'feature1_description',
      content: 'Escolha o nome da criança, idade, cenário e tema da história',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'feature2_title',
      content: 'Nossa IA cria a história',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'feature2_description',
      content: 'Nosso sistema gera textos e ilustrações personalizadas',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'feature3_title',
      content: 'Leia e compartilhe',
      content_type: 'text'
    },
    {
      page: 'index',
      section: 'features',
      key: 'feature3_description',
      content: 'Leia online, baixe em PDF ou compartilhe com a família',
      content_type: 'text'
    }
  ];
};

// Update the hero image in the database
const updateHeroImage = async () => {
  try {
    // Check if the hero image entry exists
    const { data, error } = await supabase
      .from('page_contents')
      .select('*')
      .eq('page', 'index')
      .eq('section', 'hero')
      .eq('key', 'image_url')
      .single();
    
    const imageUrl = '/lovable-uploads/242b14ba-c728-4dda-b139-e19d1b85e084.png';
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Record doesn't exist, insert it
        const { error: insertError } = await supabase
          .from('page_contents')
          .insert({
            page: 'index',
            section: 'hero',
            key: 'image_url',
            content: imageUrl,
            content_type: 'image'
          });
          
        if (insertError) {
          console.error("Error inserting hero image:", insertError);
        } else {
          console.log("Hero image inserted successfully");
        }
      } else {
        console.error("Error checking hero image:", error);
      }
    } else {
      // Record exists, update it
      const { error: updateError } = await supabase
        .from('page_contents')
        .update({ content: imageUrl })
        .eq('page', 'index')
        .eq('section', 'hero')
        .eq('key', 'image_url');
        
      if (updateError) {
        console.error("Error updating hero image:", updateError);
      } else {
        console.log("Hero image updated successfully");
      }
    }
  } catch (err) {
    console.error("Error updating hero image:", err);
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
  character_prompt?: string;
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
