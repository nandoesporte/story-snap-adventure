
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
