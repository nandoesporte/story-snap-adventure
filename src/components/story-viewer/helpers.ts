
/**
 * Formats an image URL from various sources into a standardized format
 * @param imageUrl Original image URL
 * @param theme Optional theme for fallback images
 * @returns Formatted image URL
 */
export const getImageUrl = (imageUrl?: string, theme: string = ""): string => {
  // Check cache first for faster loading
  if (imageUrl) {
    try {
      const cachedUrlKey = `image_cache_${imageUrl.split('/').pop()}`;
      const cachedUrl = localStorage.getItem(cachedUrlKey);
      if (cachedUrl) {
        console.log("Using cached image URL:", cachedUrl);
        return cachedUrl;
      }
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }
  
  // If no URL provided, return a theme-based fallback
  if (!imageUrl) return getFallbackImage(theme);
  
  // If it's already a fully-formed URL, return it
  if (imageUrl.startsWith('http')) return imageUrl;
  
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
  const themeImages: {[key: string]: string} = {
    adventure: "/images/covers/adventure.jpg",
    fantasy: "/images/covers/fantasy.jpg",
    space: "/images/covers/space.jpg",
    ocean: "/images/covers/ocean.jpg",
    dinosaurs: "/images/covers/dinosaurs.jpg",
    forest: "/images/placeholders/adventure.jpg"
  };
  
  // Try to match the theme to an appropriate image
  const themeLower = theme.toLowerCase();
  for (const [key, url] of Object.entries(themeImages)) {
    if (themeLower.includes(key)) {
      return url;
    }
  }
  
  // Default fallback
  return "/placeholder.svg";
};

/**
 * Calculates optimal image dimensions based on container size
 * @param containerWidth Width of container
 * @param containerHeight Height of container
 * @param aspectRatio Desired aspect ratio (width/height)
 * @returns Optimal dimensions
 */
export const getOptimalImageDimensions = (
  containerWidth: number, 
  containerHeight: number, 
  aspectRatio: number = 1.5
): { width: number, height: number } => {
  
  // Default dimensions
  let width = containerWidth;
  let height = containerHeight;
  
  // Calculate based on aspect ratio
  const containerRatio = containerWidth / containerHeight;
  
  if (containerRatio > aspectRatio) {
    // Container is wider than image aspect ratio
    width = containerHeight * aspectRatio;
    height = containerHeight;
  } else {
    // Container is taller than image aspect ratio
    width = containerWidth;
    height = containerWidth / aspectRatio;
  }
  
  return { width, height };
};

/**
 * Determines if an image is from a permanent storage source
 * @param imageUrl Image URL to check
 * @returns boolean indicating if the image is permanent
 */
export const isImagePermanent = (imageUrl: string): boolean => {
  return imageUrl.includes('supabase.co/storage/v1/object/public/story_images');
};
