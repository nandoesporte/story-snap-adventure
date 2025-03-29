
// Define a generic JSON type to replace 'Json'
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Story {
  id: string;
  title: string;
  user_id: string;
  character_name: string;
  character_age?: string;
  character_prompt?: string;
  cover_image_url?: string;
  pages: Array<{
    text: string;
    image_url?: string;
    imageUrl?: string;
  }>;
  content?: string[];  // Add optional content field
  created_at: string;
  updated_at: string;
  is_public: boolean;
  setting?: string;
  theme?: string;
  style?: string;
  voice_type?: 'male' | 'female';
  // Add these properties for StoryViewer component
  childName?: string;
  coverImageUrl?: string;
  voiceType?: 'male' | 'female';
}

export interface StoryListItem extends Omit<Story, 'pages'> {
  pages: Json;
}

export interface PageContent {
  id: string;
  page: string;
  section: string;
  key: string;
  content: string;
  content_type: 'text' | 'json' | 'image';
  created_at: string;
  updated_at: string;
}

export interface StoryBotPrompt {
  id: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

// Type for database functions
export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string;
          title: string;
          user_id: string;
          character_name: string;
          character_age?: string;
          character_prompt?: string;
          cover_image_url?: string;
          pages: Json;
          created_at: string;
          updated_at: string;
          is_public: boolean;
          setting?: string;
          theme?: string;
          style?: string;
          voice_type?: string;
        };
      };
      storybot_prompts: {
        Row: {
          id: string;
          prompt: string;
          created_at: string;
          updated_at: string;
        };
      };
      // Add other tables as needed
    };
  };
}
