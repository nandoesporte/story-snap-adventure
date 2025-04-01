
import { supabase } from './supabase';
import { saveImagePermanently } from './imageStorage';
import { isTemporaryUrl, isPermanentStorage } from '@/components/story-viewer/helpers';

/**
 * Checks if image URLs need to be fixed and migrates them to permanent storage
 * @param storyData Story data object with images
 * @returns Updated story data with permanent image URLs
 */
export const validateAndFixStoryImages = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    const updatedStoryData = { ...storyData };
    const storyId = storyData.id || 'unknown';
    let hasUpdates = false;
    
    // Check and fix cover image
    if (updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url) {
      const coverImageUrl = updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url;
      
      if (isTemporaryUrl(coverImageUrl) || !isPermanentStorage(coverImageUrl)) {
        console.log(`Migrating cover image for story ${storyId} to permanent storage`);
        try {
          const permanentUrl = await saveImagePermanently(coverImageUrl, storyId);
          updatedStoryData.coverImageUrl = permanentUrl;
          updatedStoryData.cover_image_url = permanentUrl;
          hasUpdates = true;
        } catch (error) {
          console.error('Error migrating cover image:', error);
        }
      }
    }
    
    // Check and fix page images
    if (Array.isArray(updatedStoryData.pages)) {
      for (let i = 0; i < updatedStoryData.pages.length; i++) {
        const page = updatedStoryData.pages[i];
        const imageUrl = page.imageUrl || page.image_url;
        
        if (imageUrl && (isTemporaryUrl(imageUrl) || !isPermanentStorage(imageUrl))) {
          console.log(`Migrating page ${i + 1} image for story ${storyId} to permanent storage`);
          try {
            const permanentUrl = await saveImagePermanently(
              imageUrl, 
              `${storyId}_page${i}`
            );
            
            updatedStoryData.pages[i] = {
              ...page,
              imageUrl: permanentUrl,
              image_url: permanentUrl
            };
            hasUpdates = true;
          } catch (error) {
            console.error(`Error migrating image for page ${i}:`, error);
          }
        }
      }
    }
    
    // If we made updates, save them back to the database
    if (hasUpdates && storyId && storyId !== 'unknown') {
      console.log(`Updating story ${storyId} in database with permanent image URLs`);
      try {
        const { error } = await supabase
          .from("stories")
          .update({
            cover_image_url: updatedStoryData.cover_image_url,
            pages: updatedStoryData.pages
          })
          .eq("id", storyId);
        
        if (error) {
          console.error('Error updating story with permanent images:', error);
        } else {
          console.log('Story updated with permanent images successfully');
        }
      } catch (dbError) {
        console.error('Database error when updating story:', dbError);
      }
    }
    
    return updatedStoryData;
  } catch (error) {
    console.error('Error validating and fixing image URLs:', error);
    return storyData; // Return original data if error
  }
};
