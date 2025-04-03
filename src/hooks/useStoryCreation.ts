
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
      
      // Sempre tentar configurar os buckets de armazenamento
      await setupStorageBuckets();
      
      const { data: userData } = await supabase.auth.getUser();
      
      console.log("Saving story images to permanent storage before database storage");
      const tempId = uuidv4();
      const processedStoryData = await saveStoryImagesPermanently({
        ...storyData,
        id: tempId
      });
      
      // Salvar localmente mesmo que não esteja autenticado
      if (!userData?.user) {
        console.log("User not authenticated, saving only to localStorage and session storage");
        sessionStorage.setItem("storyData", JSON.stringify(processedStoryData));
        
        // Salvar também no localStorage para acesso offline
        try {
          // Recuperar histórias existentes
          const existingStoriesJson = localStorage.getItem('user_stories') || '[]';
          const existingStories = JSON.parse(existingStoriesJson);
          
          // Adicionar nova história com ID gerado localmente
          const localStory = {
            ...processedStoryData,
            id: tempId,
            created_at: new Date().toISOString(),
            local_only: true
          };
          
          existingStories.push(localStory);
          
          // Salvar de volta no localStorage
          localStorage.setItem('user_stories', JSON.stringify(existingStories));
          
          toast.success("História salva localmente para acesso offline!");
        } catch (localStorageError) {
          console.error("Error saving to localStorage:", localStorageError);
        }
        
        return tempId; // Retornar o ID temporário
      }
      
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
        
        // Como o banco de dados falhou, também salvar localmente
        try {
          const localStory = {
            ...processedStoryData,
            id: tempId, 
            created_at: new Date().toISOString(),
            local_only: true,
            db_error: error.message
          };
          
          const existingStoriesJson = localStorage.getItem('user_stories') || '[]';
          const existingStories = JSON.parse(existingStoriesJson);
          existingStories.push(localStory);
          localStorage.setItem('user_stories', JSON.stringify(existingStories));
          
          toast.info("História salva localmente como backup");
        } catch (localStorageError) {
          console.error("Error saving to localStorage:", localStorageError);
        }
        
        return tempId; // Retornar o ID temporário em caso de falha no banco de dados
      }
      
      console.log("Story saved successfully:", data[0].id);
      toast.success("História salva com sucesso!");
      
      sessionStorage.setItem("storyData", JSON.stringify(processedStoryData));
      
      // Salvar também no localStorage para acesso offline
      try {
        const savedStory = {
          ...processedStoryData,
          id: data[0].id,
          created_at: new Date().toISOString()
        };
        
        const existingStoriesJson = localStorage.getItem('user_stories') || '[]';
        const existingStories = JSON.parse(existingStoriesJson);
        existingStories.push(savedStory);
        localStorage.setItem('user_stories', JSON.stringify(existingStories));
      } catch (localStorageError) {
        console.error("Error saving to localStorage:", localStorageError);
      }
      
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

  const getLocalStories = useCallback(() => {
    try {
      const storiesJson = localStorage.getItem('user_stories');
      if (!storiesJson) return [];
      
      return JSON.parse(storiesJson);
    } catch (err) {
      console.error("Error getting local stories:", err);
      return [];
    }
  }, []);

  return {
    saveStory,
    isSaving,
    error,
    getLocalStories
  };
};
