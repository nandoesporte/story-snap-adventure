
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Story, Json } from '@/types';
import { toast } from 'sonner';

interface StoryPageDetails {
  text: string;
  imageUrl: string;
}

export const extractPageDetails = (story: Story) => {
  // Safely extract page details from JSON or array
  const pages = Array.isArray(story.pages) 
    ? story.pages 
    : (story.pages && typeof story.pages === 'object' 
      ? Object.values(story.pages as Record<string, any>) 
      : []);

  return pages.map(page => ({
    text: page.text || '',
    imageUrl: page.image_url || page.imageUrl || ''
  }));
};

export const useStoryData = (storyId?: string) => {
  const [storyData, setStoryData] = useState<Story | null>(null);
  const [loading, setLoading]= useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setLoading(true);
        
        // If no storyId is provided, check if story data exists in sessionStorage
        if (!storyId) {
          const storedData = sessionStorage.getItem('storyData');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setStoryData(parsedData);
            
            // Calculate total pages (cover + content pages)
            const contentPages = Array.isArray(parsedData.pages) ? parsedData.pages.length : 0;
            setTotalPages(contentPages + 1); // +1 for cover page
            return;
          }
        }
        
        // If storyId is provided or no data in sessionStorage, fetch from database
        if (storyId) {
          const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();
            
          if (error) {
            throw new Error(`Error fetching story: ${error.message}`);
          }
          
          if (data) {
            // Transform data to match Story interface
            const transformedData: Story = {
              ...data,
              pages: typeof data.pages === 'string' ? JSON.parse(data.pages) : data.pages,
              voice_type: data.voice_type as 'male' | 'female' || 'female',
              // Add compatibility fields
              childName: data.character_name,
              coverImageUrl: data.cover_image_url,
              voiceType: data.voice_type as 'male' | 'female' || 'female'
            };
            
            // Add content field if it doesn't exist
            if (!transformedData.content && Array.isArray(transformedData.pages)) {
              transformedData.content = transformedData.pages.map(page => page.text || '');
            }
            
            setStoryData(transformedData);
            
            // Calculate total pages
            let pageCount = 0;
            if (Array.isArray(transformedData.pages)) {
              pageCount = transformedData.pages.length;
            } else if (transformedData.pages && typeof transformedData.pages === 'object') {
              pageCount = Object.keys(transformedData.pages).length;
            }
            
            setTotalPages(pageCount + 1); // +1 for cover page
          }
        }
      } catch (err) {
        console.error('Error loading story data:', err);
        setError(err as Error);
        toast.error('Failed to load story data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStoryData();
  }, [storyId]);
  
  const handleImageError = (imageSrc: string) => {
    console.warn(`Failed to load image: ${imageSrc}`);
    // You can implement fallback logic here if needed
    return true;
  };
  
  return {
    storyData,
    loading,
    error,
    totalPages,
    handleImageError
  };
};
