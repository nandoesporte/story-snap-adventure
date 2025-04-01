
import { supabase } from "@/lib/supabase";
import { getDefaultImageForTheme, isDefaultImage } from "@/lib/defaultImages";
import { setupStorageBuckets } from "@/lib/storageBucketSetup";

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
  await setupStorageBuckets();
};
