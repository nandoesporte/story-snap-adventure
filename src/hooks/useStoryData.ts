import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { saveStoryImagesPermanently } from "@/lib/imageStorage";
import { validateAndFixStoryImages } from "@/lib/imageHelper";
import { useImageUrlChecker } from "./useImageUrlChecker";

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
  const [storyImages, setStoryImages] = useState<string[]>([]);

  const { results: urlCheckResults, checkUrls } = useImageUrlChecker({
    onComplete: (results) => {
      if (results.fixed > 0 && storyId && storyData) {
        const updatedStory = { ...storyData };
        
        if (updatedStory.coverImageUrl && results.fixedUrls[updatedStory.coverImageUrl]) {
          updatedStory.coverImageUrl = results.fixedUrls[updatedStory.coverImageUrl];
          updatedStory.cover_image_url = results.fixedUrls[updatedStory.coverImageUrl];
        }
        
        if (updatedStory.pages) {
          updatedStory.pages = updatedStory.pages.map(page => {
            const pageUrl = page.imageUrl || page.image_url;
            if (pageUrl && results.fixedUrls[pageUrl]) {
              return {
                ...page,
                imageUrl: results.fixedUrls[pageUrl],
                image_url: results.fixedUrls[pageUrl]
              };
            }
            return page;
          });
        }
        
        setStoryData(updatedStory);
        updateStoryInDatabase(updatedStory, storyId);
      }
    }
  });

  const updateStoryInDatabase = async (story: any, id: string) => {
    try {
      const { error: updateError } = await supabase
        .from("stories")
        .update({
          cover_image_url: story.cover_image_url,
          pages: story.pages
        })
        .eq("id", id);
        
      if (updateError) {
        console.error("Erro ao atualizar história com imagens permanentes:", updateError);
      } else {
        console.log("História atualizada com URLs de imagens corrigidas");
        sessionStorage.setItem("storyData", JSON.stringify(story));
      }
    } catch (err) {
      console.error("Erro ao salvar URLs atualizadas no banco de dados:", err);
    }
  };

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
      
      const fixedData = await validateAndFixStoryImages(data);
      
      const coverImage = fixedData.cover_image_url || 
                      (fixedData.pages && fixedData.pages.length > 0 ? fixedData.pages[0].image_url : null) ||
                      "/images/defaults/default_cover.jpg";
                      
      console.log("Selected cover image:", coverImage);
      
      const formattedStory: StoryData = {
        title: fixedData.title || "Untitled Story",
        coverImageUrl: coverImage,
        cover_image_url: coverImage,
        childName: fixedData.character_name || "Reader",
        childAge: fixedData.character_age || "",
        theme: fixedData.theme || "",
        setting: fixedData.setting || "",
        style: fixedData.style || "",
        voiceType: fixedData.voice_type || 'female',
        pages: Array.isArray(fixedData.pages) 
          ? fixedData.pages.map((page: any) => ({
              text: page.text || "",
              imageUrl: page.image_url || "/images/defaults/default.jpg",
              image_url: page.image_url || "/images/defaults/default.jpg"
            }))
          : [{ text: "No content available.", imageUrl: "/images/defaults/default.jpg" }]
      };
      
      setStoryData(formattedStory);
      setTotalPages(formattedStory.pages.length + 1);
      setLoading(false);
      
      const imageUrls: string[] = [];
      if (formattedStory.coverImageUrl) imageUrls.push(formattedStory.coverImageUrl);
      
      formattedStory.pages.forEach(page => {
        if (page.imageUrl) imageUrls.push(page.imageUrl);
      });
      
      setStoryImages(imageUrls);
      
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
      
      const imageUrls: string[] = [];
      if (updatedStory.coverImageUrl) imageUrls.push(updatedStory.coverImageUrl);
      
      updatedStory.pages.forEach(page => {
        if (page.imageUrl) imageUrls.push(page.imageUrl);
      });
      
      if (imageUrls.length > 0) {
        setStoryImages(imageUrls);
      }
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

  const checkImageUrls = useCallback(() => {
    if (storyImages.length > 0) {
      checkUrls(storyImages);
    }
  }, [storyImages, checkUrls]);

  return {
    storyData,
    loading,
    totalPages,
    handleImageError,
    error,
    checkImageUrls,
    urlCheckResults
  };
};
