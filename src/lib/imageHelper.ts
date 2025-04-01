
import { supabase } from "@/lib/supabase";
import { saveImagePermanently } from "@/lib/imageStorage";
import { toast } from "sonner";

/**
 * Validates and fixes image URLs in a story
 * @param storyId The ID of the story to process
 * @returns Promise that resolves when processing is complete
 */
export const validateAndFixStoryImages = async (storyId: string): Promise<boolean> => {
  try {
    console.log(`Validating image URLs for story ${storyId}...`);
    
    // Fetch the story from the database
    const { data: story, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();
      
    if (error) {
      console.error("Error fetching story for image validation:", error);
      return false;
    }
    
    if (!story) {
      console.error("Story not found for image validation");
      return false;
    }
    
    let updateNeeded = false;
    
    // Check cover image
    if (story.cover_image_url) {
      console.log("Checking cover image:", story.cover_image_url);
      try {
        // Determine if the image needs to be processed
        const isTempImage = 
          story.cover_image_url.includes('oaiusercontent.com') || 
          story.cover_image_url.includes('replicate.delivery') ||
          !story.cover_image_url.includes('supabase.co/storage');
          
        if (isTempImage) {
          console.log("Cover image appears to be temporary, attempting to save permanently");
          const permanentUrl = await saveImagePermanently(story.cover_image_url, storyId);
          
          if (permanentUrl !== story.cover_image_url) {
            story.cover_image_url = permanentUrl;
            updateNeeded = true;
            console.log("Cover image updated to permanent URL");
          }
        }
      } catch (coverError) {
        console.error("Error processing cover image:", coverError);
      }
    }
    
    // Process page images
    if (Array.isArray(story.pages)) {
      console.log(`Checking ${story.pages.length} page images...`);
      
      const pagePromises = story.pages.map(async (page, index) => {
        const pageImage = page.image_url || page.imageUrl;
        
        if (!pageImage) {
          console.log(`Page ${index+1} has no image, skipping`);
          return page;
        }
        
        console.log(`Checking page ${index+1} image: ${pageImage}...`);
        
        try {
          // Determine if the image needs to be processed
          const isTempImage = 
            pageImage.includes('oaiusercontent.com') || 
            pageImage.includes('replicate.delivery') ||
            !pageImage.includes('supabase.co/storage');
            
          if (isTempImage) {
            console.log(`Page ${index+1} image appears to be temporary, saving permanently`);
            const permanentUrl = await saveImagePermanently(
              pageImage, 
              `${storyId}_page${index}`
            );
            
            if (permanentUrl !== pageImage) {
              page.image_url = permanentUrl;
              if (page.imageUrl) page.imageUrl = permanentUrl;
              updateNeeded = true;
              console.log(`Page ${index+1} image updated to permanent URL`);
            }
          }
        } catch (pageError) {
          console.error(`Error processing page ${index+1} image:`, pageError);
        }
        
        return page;
      });
      
      // Wait for all page processing to complete
      story.pages = await Promise.all(pagePromises);
    }
    
    // If any URLs were updated, save the changes to the database
    if (updateNeeded) {
      console.log("Saving updated image URLs to database");
      const { error: updateError } = await supabase
        .from("stories")
        .update({
          cover_image_url: story.cover_image_url,
          pages: story.pages
        })
        .eq("id", storyId);
        
      if (updateError) {
        console.error("Error updating story with permanent image URLs:", updateError);
        return false;
      }
      
      console.log("Story images successfully updated");
      toast.success("Imagens da história foram otimizadas para melhor visualização");
      return true;
    } else {
      console.log("No image updates needed");
      return true;
    }
  } catch (error) {
    console.error("Error validating and fixing story images:", error);
    return false;
  }
};

/**
 * Checks if an image URL exists and is accessible
 * @param url The URL to check
 * @returns Promise that resolves to a boolean indicating if the image is valid
 */
export const isImageUrlValid = async (url: string): Promise<boolean> => {
  try {
    // For relative URLs, prepend the base URL
    if (url.startsWith('/') && !url.startsWith('//')) {
      url = `${window.location.origin}${url}`;
    }
    
    // Skip validation for data URLs
    if (url.startsWith('data:image')) {
      return true;
    }
    
    // Use fetch with HEAD request to check if the image exists
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Error checking image URL validity:", error);
    return false;
  }
};
