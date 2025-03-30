
import { supabase } from "@/lib/supabase";

export const getImageUrl = (url?: string, theme: string = ""): string => {
  // Debug output
  console.log("getImageUrl processing:", url, "theme:", theme);
  
  if (!url || url === "" || url === "null" || url === "undefined") {
    const fallback = getFallbackImage(theme);
    console.log("Using fallback image:", fallback);
    return fallback;
  }
  
  try {
    const cachedUrlKey = `image_cache_${url.split('/').pop()}`;
    const cachedUrl = localStorage.getItem(cachedUrlKey);
    if (cachedUrl) {
      console.log("Using cached image URL:", cachedUrl);
      return cachedUrl;
    }
    
    // Check if there's a fallback cached for this URL (for previously failed images)
    const fallbackKey = `image_cache_fallback_${url.split('/').pop()}`;
    const fallbackUrl = localStorage.getItem(fallbackKey);
    if (fallbackUrl) {
      console.log("Using cached fallback for failed image:", fallbackUrl);
      return fallbackUrl;
    }
  } catch (error) {
    console.error("Failed to check cache for URL:", url, error);
    // Continue with normal processing if cache check fails
  }
  
  if (url.includes("supabase") && url.includes("storage") && !url.includes("object")) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketName = pathParts[pathParts.length - 2];
      const fileName = pathParts[pathParts.length - 1];
      
      const { data } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      if (data && data.publicUrl) {
        try {
          localStorage.setItem(`image_cache_${fileName}`, data.publicUrl);
        } catch (cacheError) {
          console.error("Failed to cache URL:", cacheError);
        }
        console.log("Reformatted storage URL:", data.publicUrl);
        return data.publicUrl;
      }
    } catch (error) {
      console.error("Failed to parse storage URL:", error);
    }
  }
  
  if (url.startsWith("/") && !url.startsWith("//")) {
    const fullUrl = `${window.location.origin}${url}`;
    try {
      localStorage.setItem(`image_cache_${url.split('/').pop()}`, fullUrl);
    } catch (cacheError) {
      console.error("Failed to cache URL:", cacheError);
    }
    console.log("Completed local URL:", fullUrl);
    return fullUrl;
  }
  
  if (url.startsWith("http") || url.startsWith("data:")) {
    if (url.startsWith("http")) {
      try {
        localStorage.setItem(`image_cache_${url.split('/').pop()}`, url);
      } catch (cacheError) {
        console.error("Failed to cache URL:", cacheError);
      }
    }
    console.log("Using direct URL:", url);
    return url;
  }
  
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  try {
    localStorage.setItem(`image_cache_${url.split('/').pop()}`, fullUrl);
  } catch (cacheError) {
    console.error("Failed to cache URL:", cacheError);
  }
  
  console.log("Final processed URL:", fullUrl);
  return fullUrl;
};

export const getFallbackImage = (theme: string = ""): string => {
  console.log("Getting fallback image for theme:", theme);
  const themeImages: {[key: string]: string} = {
    adventure: "/images/covers/adventure.jpg",
    fantasy: "/images/covers/fantasy.jpg",
    space: "/images/covers/space.jpg",
    ocean: "/images/covers/ocean.jpg",
    dinosaurs: "/images/covers/dinosaurs.jpg",
    forest: "/images/placeholders/adventure.jpg"
  };
  
  const themeLower = theme.toLowerCase();
  for (const [key, url] of Object.entries(themeImages)) {
    if (themeLower.includes(key)) {
      console.log("Selected theme fallback:", url);
      return url;
    }
  }
  
  console.log("Using default placeholder");
  return "/placeholder.svg";
};

// Function to verify if an image URL is accessible
export const verifyImageUrl = async (url: string): Promise<boolean> => {
  try {
    if (url.startsWith('data:')) return true;
    
    // Add a cache-busting parameter to prevent getting a cached error response
    const urlWithParam = url.includes('?') 
      ? `${url}&cacheBust=${Date.now()}` 
      : `${url}?cacheBust=${Date.now()}`;
      
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(urlWithParam, { 
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
      mode: 'no-cors'
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error("Failed to verify image URL:", url, error);
    return false;
  }
};

// Utility to clean up the URL to make it more likely to work
export const sanitizeImageUrl = (url: string): string => {
  if (!url) return "";
  
  // Fix double slashes not at the beginning of the URL
  let sanitized = url.replace(/([^:])\/\//g, '$1/');
  
  // Remove query parameters that might cause issues
  sanitized = sanitized.split('?')[0];
  
  return sanitized;
};
