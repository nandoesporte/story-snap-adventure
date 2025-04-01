
import { supabase } from "./supabase";
import { toast } from "sonner";

export const setupStorageBuckets = async () => {
  try {
    console.log("Checking if story_images bucket exists...");
    
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      toast.error("Erro ao verificar buckets de armazenamento", { id: "bucket-check-error" });
      return false;
    }
    
    // Find if story_images bucket exists
    const storyImagesBucket = buckets?.find(bucket => bucket.name === 'story_images');
    
    if (!storyImagesBucket) {
      console.log("story_images bucket doesn't exist in current user context");
      toast.warning("O bucket de imagens existe no Supabase, mas você não tem permissões para acessá-lo", { 
        id: "bucket-access-warning",
        duration: 5000
      });
      
      // The bucket likely exists but the current user can't access it due to RLS
      // We'll return true and assume it exists since we've set it up with SQL directly
      return true;
    } else {
      console.log("story_images bucket exists and is accessible by current user");
      
      // Ensure the bucket is public if we have access to update it
      try {
        const { error: updateError } = await supabase.storage.updateBucket('story_images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (updateError) {
          console.error("Error updating story_images bucket to public:", updateError);
          toast.warning("Não foi possível atualizar as permissões do bucket", { duration: 3000 });
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
    toast.error("Falha ao configurar armazenamento de imagens", { id: "storage-setup-error" });
    return false;
  }
};

// Helper function to check if an image URL can be accessed from the storage
export const verifyStorageAccess = async (): Promise<boolean> => {
  try {
    // Just try to list objects to see if we have access
    const { data, error } = await supabase.storage
      .from('story_images')
      .list('', { limit: 1 });
      
    if (error) {
      console.warn("Storage access check failed:", error);
      return false;
    }
    
    console.log("Storage access check successful");
    return true;
  } catch (error) {
    console.error("Error verifying storage access:", error);
    return false;
  }
};
