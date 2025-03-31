
/**
 * Formats an image URL from various sources into a standardized format
 * @param imageUrl Original image URL
 * @param theme Optional theme for fallback images
 * @returns Formatted image URL
 */
export const getImageUrl = (imageUrl?: string, theme: string = ""): string => {
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
