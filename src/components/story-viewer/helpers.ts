
import { supabase } from "@/lib/supabase";

export const getImageUrl = (url?: string, theme: string = ""): string => {
  if (!url || url === "" || url === "null" || url === "undefined") {
    return getFallbackImage(theme);
  }
  
  const cachedUrlKey = `image_cache_${url.split('/').pop()}`;
  const cachedUrl = localStorage.getItem(cachedUrlKey);
  if (cachedUrl) {
    console.log("Using cached image URL:", url);
    return cachedUrl;
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
        localStorage.setItem(cachedUrlKey, data.publicUrl);
        console.log("Reformatted storage URL:", data.publicUrl);
        return data.publicUrl;
      }
    } catch (error) {
      console.error("Failed to parse storage URL:", error);
    }
  }
  
  if (url.startsWith("/") && !url.startsWith("//")) {
    const fullUrl = `${window.location.origin}${url}`;
    localStorage.setItem(cachedUrlKey, fullUrl);
    return fullUrl;
  }
  
  if (url.startsWith("http") || url.startsWith("data:")) {
    if (url.startsWith("http")) {
      localStorage.setItem(cachedUrlKey, url);
    }
    console.log("Processing image URL:", url);
    return url;
  }
  
  const baseUrl = window.location.origin;
  const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  
  localStorage.setItem(cachedUrlKey, fullUrl);
  
  return fullUrl;
};

export const getFallbackImage = (theme: string = ""): string => {
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
      return url;
    }
  }
  
  return "/placeholder.svg";
};
