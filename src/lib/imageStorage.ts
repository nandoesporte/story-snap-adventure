
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { getDefaultImageForTheme } from './defaultImages';

/**
 * Saves an image to permanent storage in Supabase
 * @param imageUrl URL or Base64 of the image
 * @param filename Optional custom filename
 * @returns Promise with the permanent URL
 */
export const saveImagePermanently = async (imageUrl: string, filename?: string): Promise<string> => {
  if (!imageUrl) {
    console.error("No image URL provided to saveImagePermanently");
    return getDefaultImageForTheme('default');
  }

  try {
    // Check if the URL is already in our storage
    if (imageUrl.includes('supabase.co/storage/v1/object/public/story_images')) {
      console.log("Image is already in permanent storage:", imageUrl);
      return imageUrl;
    }

    console.log("Saving image permanently:", imageUrl.substring(0, 50) + "...");
    
    // Set up the bucket if it doesn't exist
    await setupStorageBucket();
    
    let blob: Blob;
    
    // Handle base64 data URLs
    if (imageUrl.startsWith('data:')) {
      try {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } catch (error) {
        console.error("Error converting base64 to blob:", error);
        return getDefaultImageForTheme('default');
      }
    } 
    // Handle remote URLs
    else {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) {
          console.error("Failed to fetch image:", res.status, res.statusText);
          return getDefaultImageForTheme('default');
        }
        blob = await res.blob();
      } catch (error) {
        console.error("Error fetching image URL:", error);
        return getDefaultImageForTheme('default');
      }
    }
    
    if (!blob || blob.size === 0) {
      console.error("Invalid blob - empty or null");
      return getDefaultImageForTheme('default');
    }
    
    // Generate unique filename
    const fileExt = blob.type.split('/')[1] || 'png';
    const uniqueFilename = filename ? 
      `${filename.replace(/\s+/g, '_')}_${uuidv4().substring(0, 8)}.${fileExt}` : 
      `image_${uuidv4()}.${fileExt}`;
    
    // Upload to Supabase
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(uniqueFilename, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Error uploading to Supabase:", error);
      return getDefaultImageForTheme('default');
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(uniqueFilename);
    
    console.log("Image saved to permanent storage:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error in saveImagePermanently:", error);
    return getDefaultImageForTheme('default');
  }
};

/**
 * Set up storage bucket if it doesn't exist
 */
const setupStorageBucket = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking buckets:", error);
      return;
    }
    
    const storyImagesBucket = buckets?.find(b => b.name === 'story_images');
    
    if (!storyImagesBucket) {
      console.log("Creating story_images bucket...");
      
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket('story_images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error("Error creating bucket:", createError);
      } else {
        console.log("Bucket created successfully");
      }
    }
  } catch (error) {
    console.error("Error setting up bucket:", error);
  }
};

/**
 * Process all images in a story and save them permanently
 * @param storyData Story data object
 * @returns Updated story data with permanent image URLs
 */
export const saveStoryImagesPermanently = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    const updatedStory = { ...storyData };
    
    // Process cover image
    if (updatedStory.coverImageUrl || updatedStory.cover_image_url) {
      const coverUrl = updatedStory.coverImageUrl || updatedStory.cover_image_url;
      const permanentCoverUrl = await saveImagePermanently(coverUrl, `cover_${storyData.id || 'new'}`);
      updatedStory.coverImageUrl = permanentCoverUrl;
      updatedStory.cover_image_url = permanentCoverUrl;
    }
    
    // Process page images
    if (Array.isArray(updatedStory.pages)) {
      for (let i = 0; i < updatedStory.pages.length; i++) {
        const page = updatedStory.pages[i];
        if (page.imageUrl || page.image_url) {
          const imageUrl = page.imageUrl || page.image_url;
          const permanentUrl = await saveImagePermanently(
            imageUrl, 
            `page_${i+1}_${storyData.id || 'new'}`
          );
          
          updatedStory.pages[i] = {
            ...page,
            imageUrl: permanentUrl,
            image_url: permanentUrl
          };
        }
      }
    }
    
    return updatedStory;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    return storyData;
  }
};
