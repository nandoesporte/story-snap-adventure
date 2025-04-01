
import { supabase } from "@/lib/supabase";

export const getImageUrl = (imageUrl: string, theme: string = 'default'): string => {
  if (!imageUrl) {
    return `/images/defaults/${theme}.jpg`;
  }
  
  return imageUrl;
};

export const fixImageUrl = (imageUrl: string): string => {
  if (!imageUrl) {
    return '/images/defaults/default.jpg';
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
    (url.startsWith('/images/') || url === '/placeholder.svg') ||
    (url.includes(window.location.origin) && 
     (url.includes('/images/') || url.includes('/placeholder.svg')));
  
  return isSupabaseStorage || isStaticFile;
};

export const preloadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

export const ensureImagesDirectory = async () => {
  try {
    // Check if the storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
      return;
    }
    
    const storyImagesBucket = buckets?.find(b => b.name === 'story_images');
    
    if (!storyImagesBucket) {
      console.log("Creating story_images bucket");
      const { data, error } = await supabase.storage.createBucket('story_images', {
        public: true
      });
      
      if (error) {
        console.error("Error creating bucket:", error);
      } else {
        console.log("Bucket created successfully");
      }
    } else {
      console.log("story_images bucket already exists");
    }
  } catch (error) {
    console.error("Error ensuring images directory:", error);
  }
};
