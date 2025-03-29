import { supabase } from "./supabase";
import { Json } from '@/types';

const IMAGE_CACHE_KEY = 'story_image_cache';

/**
 * Store an image URL in the local cache
 */
export const storeImageInCache = (url: string) => {
  try {
    if (!url || url.includes('placeholder')) return;

    const currentCache = getImageCache();
    currentCache[url] = {
      cachedUrl: url,
      timestamp: Date.now()
    };

    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(currentCache));
  } catch (error) {
    console.error("Error storing image in cache:", error);
  }
};

/**
 * Get an image URL from the local cache
 */
export const getImageFromCache = (url: string): string | null => {
  try {
    const currentCache = getImageCache();
    return currentCache[url]?.cachedUrl || null;
  } catch (error) {
    console.error("Error retrieving image from cache:", error);
    return null;
  }
};

/**
 * Get the current image cache
 */
export const getImageCache = (): Record<string, { cachedUrl: string; timestamp: number }> => {
  try {
    const cacheString = localStorage.getItem(IMAGE_CACHE_KEY);
    return cacheString ? JSON.parse(cacheString) : {};
  } catch (error) {
    console.error("Error parsing image cache:", error);
    return {};
  }
};

/**
 * Validate and fix story images in the database
 */
export const validateAndFixStoryImages = async (storyId: string) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('pages')
      .eq('id', storyId)
      .single();

    if (error || !data || !data.pages) {
      console.error("Error fetching story for image validation:", error);
      return;
    }

    // Safety check for data.pages
    let pagesArray: any[] = [];
    if (Array.isArray(data.pages)) {
      pagesArray = data.pages;
    } else if (typeof data.pages === 'object') {
      try {
        pagesArray = Object.values(data.pages);
      } catch (e) {
        console.error("Error converting pages object to array:", e);
        return;
      }
    } else {
      console.error("Pages data is in an unexpected format:", data.pages);
      return;
    }

    let needsUpdate = false;
    const updatedPages = pagesArray.map((page: any) => {
      if (page && typeof page === 'object') {
        // Check if image_url is valid
        if (page.image_url && typeof page.image_url === 'string') {
          // Store in cache
          storeImageInCache(page.image_url);
          return page;
        } else if (page.imageUrl && typeof page.imageUrl === 'string') {
          // Fix missing image_url
          needsUpdate = true;
          storeImageInCache(page.imageUrl);
          return { ...page, image_url: page.imageUrl };
        }
      }
      return page;
    });

    if (needsUpdate) {
      console.log("Updating story with fixed image URLs...");
      await supabase
        .from('stories')
        .update({ pages: updatedPages })
        .eq('id', storyId);
    }
  } catch (error) {
    console.error("Error in validateAndFixStoryImages:", error);
  }
};

/**
 * Function to get a placeholder image URL based on theme
 */
export const getPlaceholderImageUrl = (theme?: string): string => {
  if (!theme) return '/images/placeholders/adventure.jpg';
  
  const themeLower = theme.toLowerCase();
  
  switch (themeLower) {
    case 'adventure':
      return '/images/placeholders/adventure.jpg';
    case 'fantasy':
      return '/images/placeholders/fantasy.jpg';
    case 'space':
    case 'sci-fi':
    case 'ficção científica':
      return '/images/placeholders/space.jpg';
    case 'ocean':
    case 'sea':
    case 'water':
    case 'mar':
    case 'oceano':
      return '/images/placeholders/ocean.jpg';
    case 'dinosaurs':
    case 'dino':
    case 'dinossauros':
      return '/images/placeholders/dinosaurs.jpg';
    default:
      return '/images/placeholders/adventure.jpg';
  }
};

/**
 * Function to process page images, ensuring proper formatting
 */
export const processPageImages = (pages: any): any[] => {
  if (!pages) return [];
  
  // Handle if pages is a string (JSON)
  if (typeof pages === 'string') {
    try {
      pages = JSON.parse(pages);
    } catch (error) {
      console.error('Error parsing pages JSON:', error);
      return [];
    }
  }
  
  // Handle different data structures
  if (Array.isArray(pages)) {
    return pages.map(page => {
      if (!page) return { text: '', imageUrl: '' };
      
      // Make sure we have consistent image URL property
      const imageUrl = page.imageUrl || page.image_url || '';
      
      return {
        ...page,
        imageUrl
      };
    });
  } else if (typeof pages === 'object') {
    // Convert object to array
    return Object.values(pages).map((page: any) => {
      if (!page) return { text: '', imageUrl: '' };
      
      const imageUrl = page.imageUrl || page.image_url || '';
      
      return {
        ...page,
        imageUrl
      };
    });
  }
  
  return [];
};

export default {
  storeImageInCache,
  getImageFromCache,
  getImageCache,
  validateAndFixStoryImages,
  getPlaceholderImageUrl,
  processPageImages
};
