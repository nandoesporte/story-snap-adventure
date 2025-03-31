/**
 * Formats an image URL from various sources into a standardized format
 * @param imageUrl Original image URL
 * @param theme Optional theme for fallback images
 * @returns Formatted image URL
 */
export const getImageUrl = (imageUrl?: string, theme: string = ""): string => {
  // If no URL provided, return a theme-based fallback
  if (!imageUrl) return getFallbackImage(theme);
  
  // If it contains placeholder, return the fallback immediately
  if (imageUrl.includes('placeholder.svg') || imageUrl.includes('placeholder.png')) {
    return getFallbackImage(theme);
  }
  
  // Check if we have a cached version first
  try {
    const fileName = imageUrl.split('/').pop()?.split('?')[0];
    if (fileName) {
      const cachedUrl = localStorage.getItem(`image_cache_${fileName}`);
      if (cachedUrl && isPermanentStorage(cachedUrl)) {
        return cachedUrl;
      }
    }
  } catch (error) {
    console.error("Error checking image cache:", error);
  }
  
  // If it's already a fully-formed URL, return it
  if (imageUrl.startsWith('http')) {
    // Check if it includes query parameters that might indicate it's a temporary url
    if (imageUrl.includes('?st=') && imageUrl.includes('&se=') && imageUrl.includes('oaidalleapiprodscus')) {
      console.warn('Potentially temporary URL detected:', imageUrl);
      // We still return it, but the CoverImage component will handle fallbacks if it fails
    }
    return imageUrl;
  }
  
  // If it's a relative path, make it absolute
  if (imageUrl.startsWith('/')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // If none of the above, return the original URL
  return imageUrl;
};

/**
 * Gets a fallback image based on the story theme
 * @param theme Story theme
 * @returns URL to appropriate fallback image
 */
export const getFallbackImage = (theme: string = ""): string => {
  if (!theme || theme === "") {
    // Return a random fallback image if no theme is provided
    const fallbacks = [
      "/images/covers/adventure.jpg",
      "/images/covers/fantasy.jpg", 
      "/images/covers/space.jpg",
      "/images/covers/ocean.jpg"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  
  const themeImages: {[key: string]: string} = {
    adventure: "/images/covers/adventure.jpg",
    fantasy: "/images/covers/fantasy.jpg",
    space: "/images/covers/space.jpg",
    ocean: "/images/covers/ocean.jpg",
    dinosaurs: "/images/covers/dinosaurs.jpg",
    forest: "/images/placeholders/adventure.jpg",
    pirate: "/images/covers/adventure.jpg",
    princess: "/images/covers/fantasy.jpg",
    superhero: "/images/covers/fantasy.jpg",
    wizard: "/images/covers/fantasy.jpg",
    robot: "/images/covers/space.jpg",
    alien: "/images/covers/space.jpg"
  };
  
  // Try to match the theme to an appropriate image
  const themeLower = theme.toLowerCase();
  for (const [key, url] of Object.entries(themeImages)) {
    if (themeLower.includes(key)) {
      return url;
    }
  }
  
  // Default fallback
  return "/images/covers/adventure.jpg";
};

/**
 * Checks if an image URL is from a permanent storage location
 * @param imageUrl URL to check
 * @returns Boolean indicating if the URL is from permanent storage
 */
export const isPermanentStorage = (imageUrl: string): boolean => {
  if (!imageUrl) return false;
  return (
    imageUrl.includes('supabase.co/storage/v1/object/public/story_images') || 
    imageUrl.startsWith('/images/') ||
    imageUrl.includes('lovable-uploads')
  );
};

/**
 * Determines if an image URL is likely to be temporary
 * @param imageUrl URL to check
 * @returns Boolean indicating if the URL is likely temporary
 */
export const isTemporaryUrl = (imageUrl: string): boolean => {
  if (!imageUrl) return false;
  
  // Check for common patterns in temporary URLs
  return (
    (imageUrl.includes('oaidalleapiprodscus') && imageUrl.includes('?st=') && imageUrl.includes('&se=')) ||
    imageUrl.includes('?temp=') ||
    imageUrl.includes('&expires=')
  );
};

/**
 * Preloads an image to ensure it's in the browser cache
 * @param imageUrl URL of image to preload
 * @returns Promise that resolves when the image is loaded
 */
export const preloadImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      resolve();
      return;
    }
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      resolve();
    };
    
    img.onerror = () => {
      console.error(`Failed to preload image: ${imageUrl}`);
      reject();
    };
  });
};

/**
 * Preloads multiple images in parallel
 * @param imageUrls Array of image URLs to preload
 * @returns Promise that resolves when all images are loaded
 */
export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  try {
    await Promise.allSettled(
      imageUrls.map(url => preloadImage(url))
    );
  } catch (error) {
    console.error("Error preloading images:", error);
  }
};

/**
 * Attempts to fix common URL issues
 * @param url URL to fix
 * @returns Fixed URL
 */
export const fixBrokenImageUrl = (url: string): string => {
  if (!url) return "";
  
  // Remove any trailing URL parameters that might cause CORS issues
  if (url.includes('?')) {
    // Keep only essential parameters for temporary URLs
    if (isTemporaryUrl(url)) {
      const urlBase = url.split('?')[0];
      const essentialParams = [];
      
      if (url.includes('st=')) {
        const stMatch = url.match(/st=([^&]+)/);
        if (stMatch) essentialParams.push(`st=${stMatch[1]}`);
      }
      
      if (url.includes('se=')) {
        const seMatch = url.match(/se=([^&]+)/);
        if (seMatch) essentialParams.push(`se=${seMatch[1]}`);
      }
      
      return `${urlBase}?${essentialParams.join('&')}`;
    } else {
      // For non-temporary URLs, just return the base
      return url.split('?')[0];
    }
  }
  
  return url;
};
