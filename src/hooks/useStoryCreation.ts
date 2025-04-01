import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { saveStoryImagesPermanently } from '@/lib/imageStorage';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { setupStorageBuckets } from '@/lib/storageBucketSetup';

export interface StoryData {
  title: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  coverImageUrl: string;
  pages: {
    text: string;
    imageUrl: string;
  }[];
  voiceType?: string;
}

export const useStoryCreation = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setupStorageBuckets().catch(error => 
      console.error("Error setting up storage buckets:", error)
    );
  }, []);

  const saveStory = useCallback(async (storyData: StoryData): Promise<string | null> => {
    try {
      setIsSaving(true);
      setError(null);
      
      await setupStorageBuckets();
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        console.log("User not authenticated, saving only to session storage");
        sessionStorage.setItem("storyData", JSON.stringify(storyData));
        return null;
      }
      
      console.log("Saving story images to permanent storage before database storage");
      const tempId = uuidv4();
      const processedStoryData = await saveStoryImagesPermanently({
        ...storyData,
        id: tempId
      });
      
      const storyToSave = {
        user_id: userData.user.id,
        title: processedStoryData.title,
        cover_image_url: processedStoryData.coverImageUrl || processedStoryData.cover_image_url,
        character_name: processedStoryData.childName,
        character_age: processedStoryData.childAge,
        theme: processedStoryData.theme,
        setting: processedStoryData.setting,
        voice_type: processedStoryData.voiceType || 'female',
        pages: processedStoryData.pages.map((page: any) => ({
          text: page.text,
          image_url: page.imageUrl || page.image_url
        }))
      };
      
      console.log("Saving story to database:", { ...storyToSave, pages: `[${storyToSave.pages.length} pages]` });
      
      const { data, error } = await supabase
        .from("stories")
        .insert(storyToSave)
        .select();
      
      if (error) {
        console.error("Error saving story to database:", error);
        setError(`Failed to save story: ${error.message}`);
        toast.error("Erro ao salvar história no banco de dados");
        return null;
      }
      
      console.log("Story saved successfully:", data[0].id);
      toast.success("História salva com sucesso!");
      
      sessionStorage.setItem("storyData", JSON.stringify(processedStoryData));
      
      return data[0].id;
    } catch (err: any) {
      console.error("Error in saveStory:", err);
      setError(`Error saving story: ${err.message || "Unknown error"}`);
      toast.error(`Erro ao salvar história: ${err.message || "Erro desconhecido"}`);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    saveStory,
    isSaving,
    error
  };
};
