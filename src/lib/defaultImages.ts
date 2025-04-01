
// Map of theme names to their default image paths
const DEFAULT_THEME_IMAGES: Record<string, string> = {
  default: '/images/defaults/default.jpg',
  space: '/images/defaults/space.jpg',
  fantasy: '/images/defaults/fantasy.jpg',
  adventure: '/images/defaults/adventure.jpg',
  ocean: '/images/defaults/ocean.jpg',
  dinosaurs: '/images/defaults/dinosaurs.jpg',
  mystery: '/images/defaults/default.jpg',
  fairy: '/images/defaults/fantasy.jpg',
  superhero: '/images/defaults/adventure.jpg',
  pirate: '/images/defaults/ocean.jpg',
  princess: '/images/defaults/fantasy.jpg',
  robot: '/images/defaults/space.jpg',
  christmas: '/images/defaults/default.jpg',
  halloween: '/images/defaults/default.jpg',
  food: '/images/defaults/default.jpg',
  animals: '/images/defaults/default.jpg',
  school: '/images/defaults/default.jpg',
  family: '/images/defaults/default.jpg',
};

// Default cover image
export const DEFAULT_COVER_IMAGE = '/images/defaults/default_cover.jpg';

/**
 * Get a default image for a theme
 * @param theme The story theme
 * @returns Path to the default image for that theme
 */
export const getDefaultImageForTheme = (theme?: string): string => {
  if (!theme) return DEFAULT_THEME_IMAGES.default;
  
  // Convert to lowercase and remove any special characters
  const normalizedTheme = theme.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Find matching theme or fallback to default
  return DEFAULT_THEME_IMAGES[normalizedTheme] || DEFAULT_THEME_IMAGES.default;
};

/**
 * Check if a URL is one of our default images
 */
export const isDefaultImage = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a default image path
  return url.includes('/images/defaults/') || 
         Object.values(DEFAULT_THEME_IMAGES).some(path => url.endsWith(path));
};
