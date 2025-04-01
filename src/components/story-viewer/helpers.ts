import { supabase } from "@/lib/supabase";
import { getDefaultImageForTheme, isDefaultImage } from "@/lib/defaultImages";
import { setupStorageBuckets, verifyStorageAccess } from "@/lib/storageBucketSetup";
import { toast } from "sonner";

export const getImageUrl = (imageUrl: string, theme: string = 'default'): string => {
  if (!imageUrl) {
    return getDefaultImageForTheme(theme);
  }
  
  return imageUrl;
};

export const fixImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return getDefaultImageForTheme('default');
  }
  
  // Handle default images
  if (isDefaultImage(imageUrl)) {
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    return imageUrl;
  }
  
  // Handle relative URLs (prepend origin)
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // Handle already fixed URLs
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Try to fix broken URLs
  try {
    // If it's a Supabase URL but missing the protocol
    if (imageUrl.includes('supabase.co') && !imageUrl.startsWith('http')) {
      return `https://${imageUrl}`;
    }
    
    // If it looks like a Supabase storage object ID, try to get public URL
    if (imageUrl.match(/^[0-9a-f-]{36}\.[a-z]{3,4}$/i)) {
      const { data } = supabase.storage
        .from('story_images')
        .getPublicUrl(imageUrl);
      return data.publicUrl;
    }
  } catch (error) {
    console.error("Error fixing image URL:", error);
    // Continue to return original URL
  }
  
  return imageUrl;
};

export const isTemporaryUrl = (url: string): boolean => {
  if (!url) return false;
  
  // List of domains/patterns that indicate temporary URLs
  const temporaryDomains = [
    'oaidalleapiprodscus.blob.core.windows.net',
    'production-files.openai',
    'openai-api-files',
    'openai.com',
    'cdn.openai.com',
    'labs.openai.com'
  ];
  
  try {
    return temporaryDomains.some(domain => url.includes(domain));
  } catch (error) {
    console.error("Error checking temporary URL:", error);
    return false;
  }
};

export const isPermanentStorage = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a Supabase storage URL
  const isSupabaseStorage = url.includes('supabase.co/storage/v1/object/public');
  
  // Check if it's a static file in our project
  const isStaticFile = 
    isDefaultImage(url) ||
    (url.includes(window.location.origin) && 
     (url.includes('/images/') || url.includes('/placeholder.svg')));
  
  return isSupabaseStorage || isStaticFile;
};

export const preloadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = (e) => {
      console.error(`Failed to preload image: ${url}`, e);
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
};

export const ensureImagesDirectory = async () => {
  try {
    const bucketSetupResult = await setupStorageBuckets();
    
    if (!bucketSetupResult) {
      console.error("Failed to ensure storage buckets exist");
      toast.error("Falha ao configurar armazenamento para imagens", { 
        id: "storage-setup-error",
        duration: 5000
      });
    } else {
      console.log("Successfully ensured storage buckets exist");
      
      // Verify actual access to storage
      const hasAccess = await verifyStorageAccess();
      if (!hasAccess) {
        console.warn("Storage bucket exists but current user has no access");
        toast.warning("Você não tem permissões para acessar o armazenamento de imagens", {
          id: "storage-access-warning",
          duration: 5000
        });
      }
    }
    
    return bucketSetupResult;
  } catch (error) {
    console.error("Error ensuring images directory:", error);
    return false;
  }
};

export const testImageAccess = async (url: string): Promise<boolean> => {
  if (!url || url.startsWith('data:') || isDefaultImage(url)) {
    return true;
  }
  
  try {
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
    console.error(`Image access test failed for ${url}:`, error);
    return false;
  }
};
