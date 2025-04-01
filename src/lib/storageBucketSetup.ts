
import { supabase } from "./supabase";

export const setupStorageBuckets = async () => {
  try {
    console.log("Checking if story_images bucket exists...");
    
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return false;
    }
    
    // Find if story_images bucket exists
    const storyImagesBucket = buckets?.find(bucket => bucket.name === 'story_images');
    
    if (!storyImagesBucket) {
      console.log("Creating story_images bucket...");
      
      // Create the bucket
      const { data, error: createError } = await supabase.storage.createBucket('story_images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createError) {
        console.error("Error creating story_images bucket:", createError);
        return false;
      }
      
      console.log("story_images bucket created successfully");
      return true;
    } else {
      console.log("story_images bucket already exists");
      
      // Ensure the bucket is public
      try {
        // Update bucket to be public
        const { error: updateError } = await supabase.storage.updateBucket('story_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (updateError) {
          console.error("Error updating story_images bucket to public:", updateError);
        } else {
          console.log("Ensured story_images bucket is public");
        }
      } catch (updateErr) {
        console.error("Failed to update bucket permissions:", updateErr);
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
    return false;
  }
};
