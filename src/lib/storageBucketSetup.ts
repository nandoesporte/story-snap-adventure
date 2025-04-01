
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
      
      // No need to set bucket policy to public as we already set public: true when creating
      // The setPublic() method is not available in the current Supabase JS client version
      
      return true;
    } else {
      console.log("story_images bucket already exists");
      
      // Check if bucket is public, if not update it
      if (!storyImagesBucket.public) {
        try {
          // Update the bucket to be public
          const { error: updateError } = await supabase.storage.updateBucket('story_images', {
            public: true
          });
          
          if (updateError) {
            console.error("Error updating bucket to public:", updateError);
          } else {
            console.log("Updated story_images bucket to be public");
          }
        } catch (updateErr) {
          console.error("Failed to update bucket visibility:", updateErr);
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error("Error setting up storage buckets:", error);
    return false;
  }
};

// Call this function when the app starts to ensure the bucket exists
setupStorageBuckets().catch(console.error);
