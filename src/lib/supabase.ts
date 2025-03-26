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
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error fetching user session:', error.message);
      return { user: null, session: null };
    }
    
    // Get the user data separately
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error fetching user data:', userError.message);
      return { user: null, session: null };
    }
    
    return { user, session: data.session };
  } catch (err) {
    console.error('Unexpected error in getUser:', err);
    return { user: null, session: null };
  }
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
  try {
    const userSession = await getUser();
    if (!userSession.user) {
      throw new Error('Usuário não autenticado');
    }

    // Convert base64 images to shorter references for database storage if needed
    const processedPages = await Promise.all(story.pages.map(async (page, index) => {
      let imageUrl = page.image_url;
      
      // Check if it's a large base64 string and needs to be stored separately
      if (page.image_url && page.image_url.startsWith('data:image') && page.image_url.length > 1000) {
        try {
          // Extract base64 data
          const base64Data = page.image_url.split(',')[1];
          
          // Generate a unique filename
          const fileName = `${userSession.user.id}_${Date.now()}_page_${index}.png`;
          
          // Upload to Supabase storage
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('story_images')
            .upload(fileName, Buffer.from(base64Data, 'base64'), {
              contentType: 'image/png',
              upsert: true
            });
            
          if (storageError) {
            console.error('Error uploading image to storage:', storageError);
            // Keep the original image URL if upload fails
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase
              .storage
              .from('story_images')
              .getPublicUrl(fileName);
              
            imageUrl = publicUrlData.publicUrl;
            console.log(`Uploaded image for page ${index} to storage:`, imageUrl);
          }
        } catch (uploadError) {
          console.error('Error processing image for upload:', uploadError);
          // Keep the original image URL if processing fails
        }
      }
      
      return {
        text: page.text,
        image_url: imageUrl
      };
    }));
    
    // Process cover image if it's a base64 string
    let coverImageUrl = story.cover_image_url;
    if (story.cover_image_url && story.cover_image_url.startsWith('data:image') && story.cover_image_url.length > 1000) {
      try {
        // Extract base64 data
        const base64Data = story.cover_image_url.split(',')[1];
        
        // Generate a unique filename
        const fileName = `${userSession.user.id}_${Date.now()}_cover.png`;
        
        // Upload to Supabase storage
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('story_images')
          .upload(fileName, Buffer.from(base64Data, 'base64'), {
            contentType: 'image/png',
            upsert: true
          });
          
        if (storageError) {
          console.error('Error uploading cover image to storage:', storageError);
          // Keep the original image URL if upload fails
        } else {
          // Get public URL
          const { data: publicUrlData } = supabase
            .storage
            .from('story_images')
            .getPublicUrl(fileName);
            
          coverImageUrl = publicUrlData.publicUrl;
          console.log('Uploaded cover image to storage:', coverImageUrl);
        }
      } catch (uploadError) {
        console.error('Error processing cover image for upload:', uploadError);
        // Keep the original image URL if processing fails
      }
    }

    // Create the story entry with processed images and include character_prompt
    const storyData = {
      user_id: userSession.user.id,
      title: story.title,
      cover_image_url: coverImageUrl,
      character_name: story.character_name,
      character_age: story.character_age,
      theme: story.theme,
      setting: story.setting,
      style: story.style,
      character_prompt: story.character_prompt || '',
      pages: processedPages,
    };
    
    const { data, error } = await supabase
      .from('stories')
      .insert([storyData])
      .select();
    
    if (error) {
      console.error('Error saving story:', error);
      throw error;
    }
    
    console.log('Story saved successfully:', data);
    return data;
  } catch (err) {
    console.error('Unexpected error in saveStory:', err);
    throw err;
  }
};

export const getUserStories = async () => {
  try {
    const userSession = await getUser();
    if (!userSession.user) {
      console.warn('No authenticated user found when fetching stories');
      return [];
    }
    
    console.log('Fetching stories for user:', userSession.user.id);
    
    // Use a simplified query to avoid any potential issues with RLS policies
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, cover_image_url, character_name, character_age, theme, setting, style, created_at')
      .eq('user_id', userSession.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user stories:', error);
      throw error;
    }
    
    console.log('Stories fetched successfully, count:', data?.length);
    return data || [];
  } catch (err) {
    console.error('Unexpected error in getUserStories:', err);
    throw err;
  }
};

export const getStoryById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching story by ID:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected error in getStoryById:', err);
    throw err;
  }
};

export const deleteStory = async (id: string) => {
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  } catch (err) {
    console.error('Unexpected error in deleteStory:', err);
    throw err;
  }
};

// Admin functions
export const updateStory = async (id: string, updates: Partial<Story>) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating story:', error);
      throw error;
    }
    
    return data[0];
  } catch (err) {
    console.error('Unexpected error in updateStory:', err);
    throw err;
  }
};

export const getAllStories = async () => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all stories:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected error in getAllStories:', err);
    throw err;
  }
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
