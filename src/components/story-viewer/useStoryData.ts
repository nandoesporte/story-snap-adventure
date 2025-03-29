
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface StoryPage {
  text: string;
  imageUrl?: string;
  image_url?: string;
}

export interface StoryData {
  title: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  childName: string;
  childAge: string;
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

export const useStoryData = (id?: string) => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        
        if (id && id !== ":id") {
          console.log("Carregando história do banco com ID:", id);
          
          import('../../lib/imageHelper').then(({ validateAndFixStoryImages }) => {
            validateAndFixStoryImages(id);
          });
          
          const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("id", id)
            .single();
            
          if (error) {
            console.error("Erro ao carregar história do banco:", error);
            toast.error("Erro ao carregar história do banco de dados");
            
            loadFromSessionStorage();
            return;
          }
          
          if (data) {
            console.log("Dados da história carregados:", data);
            
            const coverImage = data.cover_image_url || 
                              (data.pages && data.pages.length > 0 ? data.pages[0].image_url : null) ||
                              "/placeholder.svg";
                              
            console.log("Selected cover image:", coverImage);
            
            const formattedStory: StoryData = {
              title: data.title || "História sem título",
              coverImageUrl: coverImage,
              cover_image_url: coverImage,
              childName: data.character_name || "Leitor",
              childAge: data.character_age || "",
              theme: data.theme || "",
              setting: data.setting || "",
              style: data.style || "",
              voiceType: data.voice_type || 'female',
              pages: Array.isArray(data.pages) 
                ? data.pages.map((page: any) => {
                    console.log("Page image URL:", page.image_url);
                    
                    if (page.image_url) {
                      import('../../lib/imageHelper').then(({ storeImageInCache }) => {
                        storeImageInCache(page.image_url);
                      });
                    }
                    
                    return {
                      text: page.text || "",
                      imageUrl: page.image_url || "/placeholder.svg",
                      image_url: page.image_url || "/placeholder.svg"
                    };
                  })
                : [{ text: "Não há conteúdo disponível.", imageUrl: "/placeholder.svg" }]
            };
            
            if (coverImage) {
              import('../../lib/imageHelper').then(({ storeImageInCache }) => {
                storeImageInCache(coverImage);
              });
            }
            
            setStoryData(formattedStory);
            setTotalPages(formattedStory.pages.length + 1);
            setLoading(false);
          } else {
            loadFromSessionStorage();
          }
        } else {
          loadFromSessionStorage();
        }
      } catch (error) {
        console.error("Erro ao carregar a história:", error);
        toast.error("Erro ao carregar a história");
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
        setLoading(false);
      }
    };
    
    const loadFromSessionStorage = () => {
      try {
        const savedData = sessionStorage.getItem("storyData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("Dados carregados do sessionStorage:", parsedData);
          
          const coverImage = parsedData.coverImageUrl || parsedData.cover_image_url || 
                           (parsedData.pages && parsedData.pages.length > 0 ? 
                             (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
                             "/placeholder.svg");
          
          const formattedStory: StoryData = {
            title: parsedData.title || "História sem título",
            coverImageUrl: coverImage,
            cover_image_url: coverImage,
            childName: parsedData.childName || parsedData.character_name || "Leitor",
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
              : [{ text: "Não há conteúdo disponível.", imageUrl: "/placeholder.svg" }]
          };
          
          setStoryData(formattedStory);
          setTotalPages(formattedStory.pages.length + 1);
        } else {
          console.error("Nenhum dado de história encontrado no sessionStorage");
          setStoryData(defaultStory);
          setTotalPages(defaultStory.pages.length + 1);
        }
      } catch (storageError) {
        console.error("Erro ao carregar dados do sessionStorage:", storageError);
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
      } finally {
        setLoading(false);
      }
    };
    
    loadStory();
  }, [id]);

  const handleImageError = (url: string) => {
    console.log("Failed to load image URL:", url);
    setFailedImages(prev => ({...prev, [url]: true}));
    
    import('../../lib/imageHelper').then(({ getImageFromCache }) => {
      const cachedUrl = getImageFromCache(url);
      if (cachedUrl) {
        console.log("Recovered image from cache:", url);
        if (storyData) {
          if (storyData.coverImageUrl === url || storyData.cover_image_url === url) {
            setStoryData({
              ...storyData,
              coverImageUrl: cachedUrl,
              cover_image_url: cachedUrl
            });
          }
          
          const updatedPages = storyData.pages.map(page => {
            if (page.imageUrl === url || page.image_url === url) {
              return {
                ...page,
                imageUrl: cachedUrl,
                image_url: cachedUrl
              };
            }
            return page;
          });
          
          setStoryData({
            ...storyData,
            pages: updatedPages
          });
        }
      } else if (Object.keys(failedImages).length < 2) {
        toast.error("Algumas imagens não puderam ser carregadas. Exibindo imagens alternativas.", {
          id: "image-load-error",
          duration: 3000
        });
      }
    });
  };

  return {
    storyData,
    setStoryData,
    loading,
    totalPages,
    failedImages,
    handleImageError,
    defaultStory
  };
};
