
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
  if ((url.includes('se=') || url.includes('exp=')) && (url.includes('sig=') || url.includes('token='))) {
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
 * Get file extension from URL or fallback to default
 */
const getFileExtension = (url: string): string => {
  if (!url) return 'png';
  
  const pathname = url.split('?')[0];
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return extension;
  }
  
  return 'png'; // Default to PNG
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
    const urlKey = imageUrl.split('/').pop()?.split('?')[0] || hashSimple(imageUrl);
    const cachedUrl = localStorage.getItem(`image_cache_${urlKey}`);
    if (cachedUrl && isPermanentStorage(cachedUrl)) {
      console.log("Using cached permanent URL:", cachedUrl);
      return cachedUrl;
    }
    
    // Generate a unique file name
    const fileName = `${storyId || 'story'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    
    console.log("Attempting to fetch and save image:", imageUrl);
    
    // Fetch the image as a blob with timeout and retry logic
    let imageBlob: Blob | null = null;
    let fetchAttempts = 0;
    const maxAttempts = 5; // Increased attempts
    
    while (fetchAttempts < maxAttempts) {
      try {
        // Create a fetch request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds
        
        // Add cache-busting parameter
        const fetchUrl = imageUrl.includes('?') 
          ? `${imageUrl}&_cb=${Date.now()}` 
          : `${imageUrl}?_cb=${Date.now()}`;
        
        console.log(`Fetch attempt ${fetchAttempts + 1}/${maxAttempts} for: ${fetchUrl}`);
        
        const response = await fetch(fetchUrl, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Add credentials: 'omit' to avoid CORS issues with third-party services
          credentials: 'omit'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        imageBlob = await response.blob();
        
        // Validate the blob
        if (!imageBlob || imageBlob.size === 0) {
          throw new Error("Downloaded blob is empty");
        }
        
        // If we got here, we have the blob and can break the retry loop
        break;
      } catch (fetchError) {
        fetchAttempts++;
        console.error(`Fetch attempt ${fetchAttempts} failed:`, fetchError);
        
        if (fetchAttempts >= maxAttempts) {
          console.error("Max fetch attempts reached, falling back to placeholder");
          
          // Get theme-specific fallback if available (extract from URL if possible)
          let theme = 'fantasy';
          if (imageUrl.includes('theme=')) {
            theme = imageUrl.split('theme=')[1].split('&')[0];
          }
          
          // Use placeholder as fallback
          const fallbackUrl = `/images/placeholders/${theme}.jpg`;
          
          toast.error("Não foi possível baixar a imagem após várias tentativas", {
            description: "Usando imagem padrão como alternativa",
            duration: 3000
          });
          
          // Cache the fallback to avoid future failures
          try {
            localStorage.setItem(`image_cache_fallback_${urlKey}`, fallbackUrl);
          } catch (e) {
            console.error("Error saving fallback to cache:", e);
          }
          
          return fallbackUrl;
        }
        
        // Wait before retrying (increasing delay for each attempt)
        await new Promise(resolve => setTimeout(resolve, fetchAttempts * 1500));
      }
    }
    
    // If we get here without imageBlob being defined, something went wrong
    if (!imageBlob) {
      console.error("Failed to fetch image after multiple attempts");
      
      // Get theme-specific fallback
      let theme = 'fantasy';
      if (imageUrl.includes('theme=')) {
        theme = imageUrl.split('theme=')[1].split('&')[0];
      }
      
      const fallbackUrl = `/images/placeholders/${theme}.jpg`;
      return fallbackUrl;
    }
    
    // Upload to Supabase storage
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(fileName, imageBlob, {
        contentType: imageBlob.type || 'image/png',
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Failed to upload image to storage:", error);
      
      // Create a fallback URL based on theme (if available)
      let theme = 'fantasy';
      if (imageUrl.includes('theme=')) {
        theme = imageUrl.split('theme=')[1].split('&')[0];
      }
      
      const fallbackUrl = `/images/placeholders/${theme}.jpg`;
      
      // Handle different error types with specific messages
      let errorMessage = "Falha ao salvar imagem no armazenamento";
      if (error.message?.includes('auth')) {
        errorMessage = "Erro de autenticação ao salvar imagem";
      } else if (error.message?.includes('exceeded')) {
        errorMessage = "Tamanho da imagem excede o limite permitido";
      }
      
      toast.error(errorMessage, {
        description: "Usando imagem alternativa",
        duration: 3000
      });
      
      return fallbackUrl;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(fileName);
      
    console.log("Image saved to permanent storage:", publicUrl);
    
    // Cache the permanent URL
    try {
      localStorage.setItem(`image_cache_${urlKey}`, publicUrl);
    } catch (cacheError) {
      console.error("Error saving URL to cache:", cacheError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error("Error saving image to permanent storage:", error);
    
    // Get theme-specific fallback
    let theme = 'fantasy';
    if (imageUrl.includes('theme=')) {
      theme = imageUrl.split('theme=')[1].split('&')[0];
    }
    
    const fallbackUrl = `/images/placeholders/${theme}.jpg`;
    
    toast.error("Erro ao salvar imagem permanentemente", {
      description: "Usando imagem padrão como alternativa",
      duration: 3000
    });
    
    return fallbackUrl;
  }
};
