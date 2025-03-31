
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { saveStoryImagesPermanently } from "@/lib/imageStorage";

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
  coverImageUrl: "/placeholder.svg",
  childName: "",
  childAge: "",
  theme: "",
  setting: "",
  pages: [
    {
      text: "Não foi possível carregar esta história. Por favor, tente criar uma nova história personalizada.",
      imageUrl: "/placeholder.svg"
    }
  ],
  voiceType: 'female'
};

export const useStoryData = (storyId?: string) => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [imagesProcessed, setImagesProcessed] = useState(false);

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        
        if (storyId && storyId !== ":id") {
          console.log("Loading story from database with ID:", storyId);
          
          const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("id", storyId)
            .single();
            
          if (error) {
            console.error("Error loading story from database:", error);
            toast.error("Error loading story from database");
            
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
        toast.error("Error loading story");
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
        setLoading(false);
      }
    };
    
    const processStoryData = async (data: any) => {
      console.log("Story data loaded:", data);
      
      const coverImage = data.cover_image_url || 
                      (data.pages && data.pages.length > 0 ? data.pages[0].image_url : null) ||
                      "/placeholder.svg";
                      
      console.log("Selected cover image:", coverImage);
      
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
        pages: Array.isArray(data.pages) 
          ? data.pages.map((page: any) => ({
              text: page.text || "",
              imageUrl: page.image_url || "/placeholder.svg",
              image_url: page.image_url || "/placeholder.svg"
            }))
          : [{ text: "No content available.", imageUrl: "/placeholder.svg" }]
      };
      
      setStoryData(formattedStory);
      setTotalPages(formattedStory.pages.length + 1);
      setLoading(false);
      
      // Processar imagens para armazenamento permanente após carregar a história
      processStoryImages(formattedStory, data.id);
    };
    
    const loadFromSessionStorage = () => {
      try {
        const savedData = sessionStorage.getItem("storyData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("Data loaded from sessionStorage:", parsedData);
          
          const coverImage = parsedData.coverImageUrl || parsedData.cover_image_url || 
                         (parsedData.pages && parsedData.pages.length > 0 ? 
                           (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
                           "/placeholder.svg");
          
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
            pages: Array.isArray(parsedData.pages) 
              ? parsedData.pages.map((page: any) => ({
                  text: page.text || "",
                  imageUrl: page.imageUrl || page.image_url || "/placeholder.svg",
                  image_url: page.imageUrl || page.image_url || "/placeholder.svg"
                }))
              : [{ text: "No content available.", imageUrl: "/placeholder.svg" }]
          };
          
          setStoryData(formattedStory);
          setTotalPages(formattedStory.pages.length + 1);
          
          // Processar imagens para armazenamento permanente após carregar a história
          processStoryImages(formattedStory);
        } else {
          console.error("No story data found in sessionStorage");
          setStoryData(defaultStory);
          setTotalPages(defaultStory.pages.length + 1);
        }
      } catch (storageError) {
        console.error("Error loading data from sessionStorage:", storageError);
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
      } finally {
        setLoading(false);
      }
    };
    
    const processStoryImages = async (story: StoryData, storyId?: string) => {
      if (imagesProcessed) return;
      
      try {
        // Processar imagens para armazenamento permanente
        const updatedStory = await saveStoryImagesPermanently({
          ...story,
          id: storyId
        });
        
        // Salvar versão atualizada da história se houver um ID
        if (storyId) {
          const { error: updateError } = await supabase
            .from("stories")
            .update({
              cover_image_url: updatedStory.cover_image_url,
              pages: updatedStory.pages
            })
            .eq("id", storyId);
            
          if (updateError) {
            console.error("Error updating story with permanent images:", updateError);
          } else {
            console.log("Story updated with permanent images");
          }
        }
        
        // Atualizar estado com as novas URLs de imagem
        setStoryData(updatedStory);
        setImagesProcessed(true);
        
        // Atualizar sessionStorage para garantir persistência mesmo após refresh
        sessionStorage.setItem("storyData", JSON.stringify(updatedStory));
      } catch (error) {
        console.error("Error processing story images:", error);
      }
    };
    
    loadStory();
  }, [storyId, imagesProcessed]);

  const getFallbackImage = (theme: string = ""): string => {
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
  
  const handleImageError = (url: string) => {
    if (!url || url === "") return;
    
    console.log("Failed to load image URL:", url);
    setFailedImages(prev => ({...prev, [url]: true}));
    
    if (Object.keys(failedImages).length < 2) {
      toast.error("Some images could not be loaded. Displaying alternative images.", {
        id: "image-load-error",
        duration: 3000
      });
    }
  };

  return {
    storyData,
    loading,
    totalPages,
    handleImageError,
    getFallbackImage
  };
};
