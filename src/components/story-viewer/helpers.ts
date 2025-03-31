
import { toast } from "sonner";

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
