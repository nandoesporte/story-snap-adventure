
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { isPermanentStorage, isTemporaryUrl } from '@/components/story-viewer/helpers';

/**
 * Saves an image to the permanent storage bucket
 * @param imageUrl URL or Base64 of the image
 * @param storyId ID of the story (optional)
 * @returns Promise with the permanent URL
 */
export const saveImagePermanently = async (imageUrl: string, storyId?: string): Promise<string> => {
  try {
    // If already a URL from permanent storage, return it
    if (isPermanentStorage(imageUrl)) {
      console.log("Image is already in permanent storage:", imageUrl);
      return imageUrl;
    }
    
    // Check local cache first
    try {
      const urlKey = imageUrl.split('/').pop()?.split('?')[0];
      if (urlKey) {
        const cachedUrl = localStorage.getItem(`image_cache_${urlKey}`);
        if (cachedUrl && isPermanentStorage(cachedUrl)) {
          console.log("Using cached permanent URL:", cachedUrl);
          return cachedUrl;
        }
      }
    } catch (cacheError) {
      console.error("Error checking cache:", cacheError);
    }
    
    // Generate a unique filename
    const fileExtension = 'png';
    const fileName = `${storyId || 'story'}_${uuidv4()}.${fileExtension}`;
    
    // Determine if it's a URL or base64
    let imageBlob: Blob;
    
    if (imageUrl.startsWith('data:image')) {
      // Convert base64 to Blob
      const response = await fetch(imageUrl);
      imageBlob = await response.blob();
    } else {
      // Fetch image from external URL
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        // Add cache-busting for temporary URLs
        const fetchUrl = isTemporaryUrl(imageUrl) 
          ? `${imageUrl}&_cb=${Date.now()}`
          : imageUrl;
        
        const response = await fetch(fetchUrl, { 
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        imageBlob = await response.blob();
      } catch (fetchError) {
        console.error("Error fetching image from URL:", fetchError);
        // Return original URL on error
        return imageUrl;
      }
    }
    
    // Upload to Supabase storage bucket
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/png'
      });
      
    if (error) {
      console.error("Error uploading image to storage:", error);
      return imageUrl; // Return original URL on error
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(fileName);
      
    console.log("Image saved permanently:", publicUrl);
    
    // Cache the permanent URL
    try {
      const urlKey = imageUrl.split('/').pop()?.split('?')[0];
      if (urlKey) {
        localStorage.setItem(`image_cache_${urlKey}`, publicUrl);
      }
    } catch (cacheError) {
      console.error("Error caching URL:", cacheError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error("Error saving image permanently:", error);
    return imageUrl; // Return original URL on error
  }
};

/**
 * Converts all images in a story to permanent storage
 * @param storyData Story data
 * @returns Promise with updated story data
 */
export const saveStoryImagesPermanently = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    const updatedStoryData = { ...storyData };
    
    // Save cover image
    if (updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url) {
      const coverImageUrl = updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url;
      const permanentCoverUrl = await saveImagePermanently(coverImageUrl, updatedStoryData.id);
      
      updatedStoryData.coverImageUrl = permanentCoverUrl;
      updatedStoryData.cover_image_url = permanentCoverUrl;
    }
    
    // Save page images with parallel processing for faster results
    if (Array.isArray(updatedStoryData.pages)) {
      const pagePromises = updatedStoryData.pages.map(async (page: any, index: number) => {
        const imageUrl = page.imageUrl || page.image_url;
        if (imageUrl) {
          const permanentImageUrl = await saveImagePermanently(
            imageUrl, 
            `${updatedStoryData.id || 'page'}_page${index}`
          );
          
          return {
            ...page,
            imageUrl: permanentImageUrl,
            image_url: permanentImageUrl
          };
        }
        return page;
      });
      
      updatedStoryData.pages = await Promise.all(pagePromises);
    }
    
    return updatedStoryData;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    return storyData; // Return original data on error
  }
};
