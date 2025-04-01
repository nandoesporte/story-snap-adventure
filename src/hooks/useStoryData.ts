
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { saveStoryImagesPermanently } from "@/lib/imageStorage";
import { validateAndFixStoryImages } from "@/lib/imageHelper";

interface StoryPage {
  text: string;
  imageUrl?: string;
  image_url?: string;
}

interface StoryData {
  title: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  childName: string;
  childAge?: string;
  theme: string;
  setting: string;
  characterName?: string;
  pages: StoryPage[];
  language?: string;
  style?: string;
  moral?: string;
  readingLevel?: string;
  voiceType?: 'male' | 'female';
}

const defaultStory: StoryData = {
  title: "História não encontrada",
  coverImageUrl: "/images/defaults/default_cover.jpg",
  cover_image_url: "/images/defaults/default_cover.jpg",
  childName: "",
  childAge: "",
  theme: "",
  setting: "",
  pages: [
    {
      text: "Não foi possível carregar esta história. Por favor, tente criar uma nova história personalizada.",
      imageUrl: "/images/defaults/default.jpg",
      image_url: "/images/defaults/default.jpg"
    }
  ],
  voiceType: 'female'
};

export const useStoryData = (storyId?: string, retryCount: number = 0) => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [imagesProcessed, setImagesProcessed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Reset state when storyId or retryCount changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setImagesProcessed(false);
    setFailedImages({});
    setStoryData(null);
  }, [storyId, retryCount]);

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (storyId && storyId !== ":id") {
          console.log("Loading story from database with ID:", storyId);
          
          const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("id", storyId)
            .single();
            
          if (error) {
            console.error("Error loading story from database:", error);
            setError(new Error(`Failed to load story: ${error.message}`));
            
            loadFromSessionStorage();
            return;
          }
          
          if (data) {
            processStoryData(data);
          } else {
            loadFromSessionStorage();
          }
        } else {
          loadFromSessionStorage();
        }
      } catch (error) {
        console.error("Error loading story:", error);
        setError(error instanceof Error ? error : new Error("Unknown error loading story"));
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
        setLoading(false);
      }
    };
    
    loadStory();
  }, [storyId, retryCount]);

  const processStoryData = async (data: any) => {
    try {
      console.log("Story data loaded:", data);
      
      // Make sure we have a valid cover image
      const coverImage = data.cover_image_url || 
                      (data.pages && data.pages.length > 0 ? data.pages[0].image_url : null) ||
                      "/images/defaults/default_cover.jpg";
                      
      console.log("Selected cover image:", coverImage);
      
      // Process page images to ensure they have URLs
      const processedPages = Array.isArray(data.pages) 
        ? data.pages.map((page: any, index: number) => {
            // Make sure each page has an image URL
            const pageImageUrl = page.image_url || page.imageUrl || `/images/defaults/${data.theme || 'default'}.jpg`;
            
            return {
              text: page.text || "",
              imageUrl: pageImageUrl,
              image_url: pageImageUrl
            };
          })
        : [{ 
            text: "No content available.", 
            imageUrl: "/images/defaults/default.jpg",
            image_url: "/images/defaults/default.jpg" 
          }];
      
      const formattedStory: StoryData = {
        title: data.title || "Untitled Story",
        coverImageUrl: coverImage,
        cover_image_url: coverImage,
        childName: data.character_name || "Reader",
        childAge: data.character_age || "",
        theme: data.theme || "",
        setting: data.setting || "",
        style: data.style || "",
        voiceType: data.voice_type || 'female',
        pages: processedPages
      };
      
      setStoryData(formattedStory);
      setTotalPages(formattedStory.pages.length + 1);
      setLoading(false);
      
      // Process images for permanent storage after loading the story
      processStoryImages(formattedStory, data.id);
      
      // Validate and fix any temporary image URLs
      if (data.id) {
        validateAndFixStoryImages(data.id)
          .catch(err => console.error("Error validating images:", err));
      }
    } catch (processError) {
      console.error("Error processing story data:", processError);
      setError(processError instanceof Error ? processError : new Error("Failed to process story data"));
      setLoading(false);
    }
  };
    
  const loadFromSessionStorage = () => {
    try {
      const savedData = sessionStorage.getItem("storyData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log("Data loaded from sessionStorage:", parsedData);
        
        // Make sure we have a valid cover image
        const coverImage = parsedData.coverImageUrl || parsedData.cover_image_url || 
                         (parsedData.pages && parsedData.pages.length > 0 ? 
                           (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
                           "/images/defaults/default_cover.jpg");
        
        // Process pages to ensure they have image URLs
        const processedPages = Array.isArray(parsedData.pages) 
          ? parsedData.pages.map((page: any, index: number) => {
              // Make sure each page has an image URL
              const pageImageUrl = page.imageUrl || page.image_url || `/images/defaults/${parsedData.theme || 'default'}.jpg`;
              
              return {
                text: page.text || "",
                imageUrl: pageImageUrl,
                image_url: pageImageUrl
              };
            })
          : [{ 
              text: "No content available.", 
              imageUrl: "/images/defaults/default.jpg",
              image_url: "/images/defaults/default.jpg" 
            }];
        
        const formattedStory: StoryData = {
          title: parsedData.title || "Untitled Story",
          coverImageUrl: coverImage,
          cover_image_url: coverImage,
          childName: parsedData.childName || parsedData.character_name || "Reader",
          childAge: parsedData.childAge || parsedData.character_age || "",
          theme: parsedData.theme || "",
          setting: parsedData.setting || "",
          style: parsedData.style || "",
          voiceType: parsedData.voiceType || 'female',
          pages: processedPages
        };
        
        setStoryData(formattedStory);
        setTotalPages(formattedStory.pages.length + 1);
        
        // Process images for permanent storage after loading the story
        processStoryImages(formattedStory);
      } else {
        console.error("No story data found in sessionStorage");
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
      }
    } catch (storageError) {
      console.error("Error loading data from sessionStorage:", storageError);
      setError(storageError instanceof Error ? storageError : new Error("Failed to load story from session"));
      setStoryData(defaultStory);
      setTotalPages(defaultStory.pages.length + 1);
    } finally {
      setLoading(false);
    }
  };
    
  const processStoryImages = async (story: StoryData, storyId?: string) => {
    if (imagesProcessed) return;
    
    try {
      console.log("Processing images to ensure they are permanently stored");
      
      // Process images for permanent storage
      const updatedStory = await saveStoryImagesPermanently({
        ...story,
        id: storyId
      });
      
      // Save updated version of the story if there's an ID
      if (storyId) {
        const { error: updateError } = await supabase
          .from("stories")
          .update({
            cover_image_url: updatedStory.cover_image_url || updatedStory.coverImageUrl,
            pages: updatedStory.pages
          })
          .eq("id", storyId);
          
        if (updateError) {
          console.error("Error updating story with permanent images:", updateError);
        } else {
          console.log("Story updated with permanent images");
        }
      }
      
      // Update state with the new image URLs
      setStoryData(updatedStory);
      setImagesProcessed(true);
      
      // Update sessionStorage to ensure persistence even after refresh
      sessionStorage.setItem("storyData", JSON.stringify(updatedStory));
    } catch (error) {
      console.error("Error processing story images:", error);
    }
  };
  
  const handleImageError = useCallback((url: string) => {
    if (!url || url === "") return;
    
    console.log("Failed to load image URL:", url);
    setFailedImages(prev => ({...prev, [url]: true}));
    
    if (Object.keys(failedImages).length < 2) {
      toast.error("Algumas imagens não puderam ser carregadas.", {
        id: "image-load-error",
        duration: 3000
      });
    }
  }, [failedImages]);

  return {
    storyData,
    loading,
    totalPages,
    handleImageError,
    error
  };
};
