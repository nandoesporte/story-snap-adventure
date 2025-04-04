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

export const useStoryData = (storyId?: string) => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [imagesProcessed, setImagesProcessed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retryLoading = useCallback(() => {
    console.log("Retrying story loading with ID:", storyId);
    setLoading(true);
    setError(null);
    setImagesProcessed(false);
    setFailedImages({});
    setStoryData(null);
    setRetryCount(prev => prev + 1);
    toast.info("Recarregando história...", {
      description: `Attempting to load story ${storyId}`
    });
  }, [storyId]);

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
            .maybeSingle();
            
          if (error) {
            console.error("Detailed error loading story from database:", error);
            
            toast.error("Erro ao carregar história", {
              description: error.message || "Falha desconhecida ao buscar história",
              duration: 5000
            });
            
            setError(new Error(`Failed to load story: ${error.message}`));
            loadFromSessionStorage();
            return;
          }
          
          if (data) {
            processStoryData(data);
          } else {
            console.warn("No story found in database with ID:", storyId);
            toast.warning("História não encontrada", {
              description: "Verificando armazenamento temporário...",
              duration: 3000
            });
            loadFromSessionStorage();
          }
        } else {
          console.log("No story ID provided, loading from session storage");
          loadFromSessionStorage();
        }
      } catch (error) {
        console.error("Unexpected error in story loading:", error);
        toast.error("Erro inesperado", {
          description: "Não foi possível carregar a história",
          duration: 5000
        });
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
      
      const fixedData = await validateAndFixStoryImages(data);
      
      const coverImage = fixedData.cover_image_url || 
                      (fixedData.pages && fixedData.pages.length > 0 ? fixedData.pages[0].image_url : null) ||
                      "/images/defaults/default_cover.jpg";
                      
      console.log("Selected cover image:", coverImage);
      
      const formattedStory: StoryData = {
        title: fixedData.title || "Untitled Story",
        coverImageUrl: coverImage,
        cover_image_url: coverImage,
        childName: fixedData.character_name || fixedData.childName || "Reader",
        childAge: fixedData.character_age || fixedData.childAge || "",
        theme: fixedData.theme || "",
        setting: fixedData.setting || "",
        style: fixedData.style || "",
        voiceType: fixedData.voice_type || fixedData.voiceType || 'female',
        pages: Array.isArray(fixedData.pages) 
          ? fixedData.pages.map((page: any) => ({
              text: page.text || "",
              imageUrl: page.image_url || page.imageUrl || "/images/defaults/default.jpg",
              image_url: page.image_url || page.imageUrl || "/images/defaults/default.jpg"
            }))
          : [{ text: "No content available.", imageUrl: "/images/defaults/default.jpg" }]
      };
      
      setStoryData(formattedStory);
      setTotalPages(formattedStory.pages.length + 1);
      setLoading(false);
      
      processStoryImages(formattedStory, data.id);
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
        
        const coverImage = parsedData.coverImageUrl || parsedData.cover_image_url || 
                         (parsedData.pages && parsedData.pages.length > 0 ? 
                           (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
                           "/images/defaults/default_cover.jpg");
        
        const processedPages = Array.isArray(parsedData.pages) 
          ? parsedData.pages.map((page: any, index: number) => {
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
        
        processStoryImages(formattedStory);
      } else {
        console.error("No story data found in sessionStorage");
        setError(new Error("Nenhuma história encontrada no armazenamento temporário"));
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
      
      const updatedStory = await saveStoryImagesPermanently({
        ...story,
        id: storyId
      });
      
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
      
      setStoryData(updatedStory);
      setImagesProcessed(true);
      
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
    error,
    retryLoading
  };
};
