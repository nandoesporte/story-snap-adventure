import { toast } from 'sonner';

// Check if an image URL exists in the permanent storage
export const isPermanentStorage = (url: string | undefined): boolean => {
  if (!url) return false;
  
  try {
    return url.includes('supabase.co/storage/v1/object/public/story_images') ||
           url.includes('storage.googleapis.com') ||
           url.includes('amazonaws.com');
  } catch (e) {
    return false;
  }
};

// Check if an image URL is temporary
export const isTemporaryUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  
  try {
    return url.includes('oaiusercontent.com') || 
           url.includes('openai.com') ||
           url.includes('replicate.delivery') ||
           url.includes('temp-') ||
           url.includes('leonard.ai') ||
           url.includes('pb.ai/api');
  } catch (e) {
    return false;
  }
};

// Get a proper image URL with fallback
export const getImageUrl = (imageUrl: string | undefined, theme?: string): string => {
  if (!imageUrl) {
    return getDefaultImagePath(theme);
  }
  
  // Check if it's already a data URL
  if (imageUrl.startsWith('data:image')) {
    return imageUrl;
  }
  
  // Check if it's an absolute URL (external)
  if (imageUrl.startsWith('http')) {
    // Check if it's a default placeholder from an external source
    if (imageUrl.includes('placeholder') || imageUrl.includes('default')) {
      return getDefaultImagePath(theme);
    }
    return imageUrl;
  }
  
  // Check if it's a relative URL (internal)
  if (imageUrl.startsWith('/')) {
    // Check if it's a default placeholder
    if (imageUrl.includes('placeholder') || imageUrl.includes('/images/defaults/')) {
      return getDefaultImagePath(theme);
    }
    
    // Make sure internal URLs are properly formatted
    if (imageUrl.startsWith('//')) {
      return `https:${imageUrl}`;
    }
    
    // Ensure the path is correctly formatted for internal resources
    return imageUrl;
  }
  
  // Default fallback
  return getDefaultImagePath(theme);
};

// Get default image based on theme
export const getDefaultImagePath = (theme?: string): string => {
  const defaultImages: Record<string, string> = {
    'space': '/images/defaults/space.jpg',
    'ocean': '/images/defaults/ocean.jpg',
    'fantasy': '/images/defaults/fantasy.jpg',
    'adventure': '/images/defaults/adventure.jpg',
    'dinosaurs': '/images/defaults/dinosaurs.jpg',
    'default': '/placeholder.svg'
  };
  
  return theme && defaultImages[theme] 
    ? defaultImages[theme] 
    : defaultImages['default'];
};

// Preload an image with timeout
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!src || src.trim() === '') {
      reject(new Error('Empty image source'));
      return;
    }
    
    // Use a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      reject(new Error(`Image preload timeout: ${src}`));
    }, 10000);
    
    try {
      const img = new Image();
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      
      img.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error('Error preloading image:', src, error);
        reject(error);
      };
      
      img.src = src;
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

// Ensure images directory exists
export const ensureImagesDirectory = () => {
  try {
    // Check if default images directory exists
    const defaultImagesPath = '/images/defaults';
    const img = new Image();
    img.src = `${defaultImagesPath}/default.jpg`;
    
    img.onerror = () => {
      console.error('Default images directory may not exist or is inaccessible');
      toast.error('Erro ao carregar imagens padrão. Algumas ilustrações podem não aparecer corretamente.');
    };
  } catch (error) {
    console.error('Error checking images directory:', error);
  }
};

// Fix image URL if needed
export const fixImageUrl = (url: string | undefined): string => {
  if (!url) return getDefaultImagePath();
  
  // If it's a data URL, return as is
  if (url.startsWith('data:image')) {
    return url;
  }
  
  // Handle relative paths
  if (url.startsWith('/')) {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return url;
    }
    
    // For production, ensure full path
    return `${window.location.origin}${url}`;
  }
  
  return url;
};
