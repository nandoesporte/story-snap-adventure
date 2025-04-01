
// Helper functions for story viewer components

/**
 * Checks if a URL is from a permanent storage location
 */
export const isPermanentStorage = (url: string | undefined): boolean => {
  if (!url) return false;
  
  try {
    return url.includes('supabase.co/storage/v1/object/public') || 
           url.includes('/placeholder.svg') ||
           url.startsWith('/');
  } catch (e) {
    return false;
  }
};

/**
 * Checks if a URL is a temporary one that will expire
 */
export const isTemporaryUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  
  try {
    // Check for OpenAI or other AI service temporary URLs
    return (url.includes('oaiusercontent.com') || 
           url.includes('openai.com') ||
           url.includes('replicate.delivery') ||
           url.includes('temp-') ||
           url.includes('leonardo.ai') ||
           url.includes('pb.ai/api')) &&
           !url.includes('supabase.co/storage');
  } catch (e) {
    return false;
  }
};

/**
 * Gets a formatted image URL, handling theme-specific paths and fallbacks
 */
export const getImageUrl = (url: string | undefined, theme?: string): string => {
  if (!url || url === '') {
    return getFallbackImage(theme);
  }
  
  if (url.startsWith('data:image')) {
    return url;
  }
  
  // Handle relative URLs
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${window.location.origin}${url}`;
  }
  
  return url;
};

/**
 * Gets a fallback image based on theme
 */
export const getFallbackImage = (theme?: string): string => {
  if (!theme) return '/placeholder.svg';
  
  // Map themes to placeholder images
  switch(theme.toLowerCase()) {
    case 'aventura':
    case 'adventure':
      return '/images/placeholders/adventure.jpg';
    case 'espaço':
    case 'space':
      return '/images/placeholders/space.jpg';
    case 'oceano':
    case 'ocean':
      return '/images/placeholders/ocean.jpg';
    case 'dinossauros':
    case 'dinosaurs':
      return '/images/placeholders/dinosaurs.jpg';
    case 'fantasia':
    case 'fantasy':
      return '/images/placeholders/fantasy.jpg';
    default:
      return '/placeholder.svg';
  }
};

/**
 * Preloads an image to improve performance during page transitions
 */
export const preloadImage = async (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error('Error preloading image:', src, e);
      reject(new Error(`Failed to preload image: ${src}`));
    };
    img.src = src;
  });
};
