
import { supabase } from "@/lib/supabase";

/**
 * Gets a valid image URL for display, with fallback options
 */
export const getImageUrl = (url?: string, theme: string = ""): string => {
  console.log("getImageUrl processing:", url, "theme:", theme);

  if (!url || url === "" || url === "null" || url === "undefined") {
    return getFallbackImage(theme);
  }
  
  // Check for cached URL first
  const cachedUrlKey = `image_cache_${url.split('/').pop()}`;
  const cachedUrl = localStorage.getItem(cachedUrlKey);
  if (cachedUrl) {
    console.log("Using cached image URL:", cachedUrl);
    return cachedUrl;
  }
  
  // Handle Supabase storage URLs
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
        localStorage.setItem(cachedUrlKey, data.publicUrl);
        console.log("Reformatted storage URL:", data.publicUrl);
        return data.publicUrl;
      }
    } catch (error) {
      console.error("Failed to parse storage URL:", error);
    }
  }
  
  // Handle relative URLs
  if (url.startsWith("/") && !url.startsWith("//")) {
    const fullUrl = `${window.location.origin}${url}`;
    localStorage.setItem(cachedUrlKey, fullUrl);
    return fullUrl;
  }
  
  // Use URL directly if it's already absolute
  if ((url.startsWith("http") || url.startsWith("data:")) && url !== "null") {
    if (url.startsWith("http")) {
      localStorage.setItem(cachedUrlKey, url);
    }
    return url;
  }
  
  // For any other cases, create a full URL
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  localStorage.setItem(cachedUrlKey, fullUrl);
  return fullUrl;
};

/**
 * Gets a fallback image based on the story theme
 */
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
  
  console.log("Using default fallback: /placeholder.svg");
  return "/placeholder.svg";
};
