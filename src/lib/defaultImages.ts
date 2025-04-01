
// Default theme-based image mapping
const themeImageMap: Record<string, string> = {
  default: '/images/defaults/default.jpg',
  space: '/images/defaults/space.jpg',
  ocean: '/images/defaults/ocean.jpg',
  fantasy: '/images/defaults/fantasy.jpg',
  adventure: '/images/defaults/adventure.jpg',
  dinosaurs: '/images/defaults/dinosaurs.jpg',
};

/**
 * Get the default image URL for a specific theme
 * @param theme Theme name
 * @returns Image URL
 */
export const getDefaultImageForTheme = (theme: string = 'default'): string => {
  const imageUrl = themeImageMap[theme.toLowerCase()] || themeImageMap.default;
  return imageUrl;
};

/**
 * Check if an image URL is one of our default images
 * @param url Image URL to check
 * @returns Boolean indicating if it's a default image
 */
export const isDefaultImage = (url: string): boolean => {
  if (!url) return false;
  
  // Clean the URL for comparison
  const cleanUrl = url.split('?')[0];
  
  // Check if it's in our defaults
  return Object.values(themeImageMap).some(defaultImage => 
    cleanUrl.includes(defaultImage) || 
    cleanUrl.endsWith(`/images/defaults/${defaultImage.split('/').pop()}`)
  );
};
