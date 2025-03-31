
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

/**
 * Get a formatted image URL with fallback handling
 */
export const getImageUrl = (url?: string, theme?: string): string => {
  if (!url || url === "") {
    return getFallbackImage(theme);
  }
  
  // Handle oaidalleapiprodscus.blob.core.windows.net URLs (OpenAI DALL-E)
  // These URLs are temporary and will expire
  if (url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
    console.warn("Potentially temporary URL detected:", url);
    
    // Try to use a cached version if available
    const cachedUrl = localStorage.getItem(`image_cache_${hashSimple(url)}`);
    if (cachedUrl) {
      console.log("Using cached URL for DALL-E image:", cachedUrl);
      return cachedUrl;
    }
    
    // Return original URL but also prepare a fallback
    return url;
  }
  
  // Check if URL is already a valid absolute URL
  if (url.startsWith('http')) {
    return url;
  }
  
  // Handle relative paths
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  
  // Handle theme-specific placeholders
  if (url === 'placeholder' && theme) {
    return `/images/placeholders/${theme}.jpg`;
  }
  
  return url;
};

/**
 * Get a fallback image based on theme
 */
export const getFallbackImage = (theme?: string): string => {
  // List of available themes
  const validThemes = ['adventure', 'fantasy', 'space', 'ocean', 'dinosaurs'];
  const defaultTheme = 'fantasy';
  
  // Use a theme-specific fallback if available
  if (theme && validThemes.includes(theme)) {
    return `/images/placeholders/${theme}.jpg`;
  }
  
  return `/images/placeholders/${defaultTheme}.jpg`;
};

/**
 * Check if an URL points to permanent storage
 */
export const isPermanentStorage = (url: string): boolean => {
  if (!url) return false;
  
  // Check if URL is from Supabase storage
  if (url.includes('supabase.co/storage/v1/object/public')) {
    return true;
  }
  
  // Check if URL is from our project's static assets
  if (url.startsWith(window.location.origin) && url.includes('/images/')) {
    return true;
  }
  
  // Check if it's a relative path to static assets
  if (url.startsWith('/images/') || url === '/placeholder.svg') {
    return true;
  }
  
  return false;
};

/**
 * Check if an URL is likely temporary
 */
export const isTemporaryUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check known temporary URL patterns
  if (url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
    return true;
  }
  
  // Check for URLs with expiry parameters
  if (url.includes('se=') && (url.includes('sig=') || url.includes('token='))) {
    return true;
  }
  
  // Check for URLs with explicit expiry tokens
  if (url.includes('expiry=') || url.includes('expires=')) {
    return true;
  }
  
  return false;
};

/**
 * Preload an image
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!src || src === "") {
      reject(new Error("Empty image URL"));
      return;
    }
    
    // Skip preloading for blob URLs with expiry tokens
    if (src.includes('blob.core.windows.net') && src.includes('se=')) {
      const expiryParam = src.match(/se=([^&]+)/);
      if (expiryParam && expiryParam[1]) {
        try {
          const expiryDate = new Date(decodeURIComponent(expiryParam[1]));
          const now = new Date();
          
          // If URL is expired or close to expiry, don't try to preload
          if (expiryDate < now || (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000)) {
            console.warn("Skipping preload for expired/near-expiry URL:", src);
            resolve(); // Resolve without preloading
            return;
          }
        } catch (e) {
          console.error("Error parsing expiry date:", e);
          // Continue with preload attempt
        }
      }
    }
    
    const img = new Image();
    
    img.onload = () => {
      resolve();
    };
    
    img.onerror = (e) => {
      console.error("Failed to preload image:", src, e);
      reject(new Error(`Failed to preload: ${src}`));
    };
    
    // Add a random cache buster to avoid caching issues
    const cacheBuster = `_cb=${Date.now()}`;
    img.src = src.includes('?') ? `${src}&${cacheBuster}` : `${src}?${cacheBuster}`;
    
    // Set a timeout to avoid hanging on slow-loading images
    setTimeout(() => {
      resolve(); // Resolve anyway after timeout
    }, 3000);
  });
};

/**
 * Simple hash function for caching images
 */
const hashSimple = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

/**
 * Save an image to permanent storage
 */
export const saveImageToPermanentStorage = async (imageUrl: string, storyId?: string): Promise<string> => {
  try {
    // If already in permanent storage, return as is
    if (isPermanentStorage(imageUrl)) {
      return imageUrl;
    }
    
    // Check cache first
    const urlKey = imageUrl.split('/').pop()?.split('?')[0];
    if (urlKey) {
      const cachedUrl = localStorage.getItem(`image_cache_${urlKey}`);
      if (cachedUrl && isPermanentStorage(cachedUrl)) {
        console.log("Using cached permanent URL:", cachedUrl);
        return cachedUrl;
      }
    }
    
    // Generate a unique file name
    const fileName = `${storyId || 'story'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    
    console.log("Attempting to fetch and save image:", imageUrl);
    
    // Fetch the image as a blob
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error("Failed to fetch image:", response.status);
      toast.error("Falha ao baixar a imagem");
      return imageUrl; // Return original URL if fetch fails
    }
    
    const imageBlob = await response.blob();
    
    // Upload to Supabase storage
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Failed to upload image to storage:", error);
      toast.error("Falha ao salvar imagem no armazenamento permanente");
      return imageUrl; // Return original URL if upload fails
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(fileName);
      
    console.log("Image saved to permanent storage:", publicUrl);
    toast.success("Imagem salva no armazenamento permanente");
    
    // Cache the permanent URL
    if (urlKey) {
      localStorage.setItem(`image_cache_${urlKey}`, publicUrl);
    }
    
    return publicUrl;
  } catch (error) {
    console.error("Error saving image to permanent storage:", error);
    toast.error("Erro ao salvar imagem permanentemente");
    return imageUrl; // Return original URL if any error occurs
  }
};
