
import { getDefaultImageForTheme } from './defaultImages';
import { toast } from 'sonner';
import { uploadToImgBB } from './imgbbUploader';

/**
 * Salva uma imagem permanentemente usando ImgBB
 * @param imageData URL, Base64 ou Blob da imagem
 * @param filename Nome de arquivo personalizado opcional
 * @returns Promise com a URL permanente
 */
export const saveImagePermanently = async (imageData: string | Blob, filename?: string): Promise<string> => {
  if (!imageData) {
    console.error("No image data provided to saveImagePermanently");
    return getDefaultImageForTheme('default');
  }

  try {
    // Verificar se é um Blob ou string
    if (typeof imageData === 'string') {
      // Verificar se a URL já está no ImgBB
      if (imageData.includes('i.ibb.co') || imageData.includes('image.ibb.co')) {
        console.log("Image is already in ImgBB storage:", imageData);
        return imageData;
      }

      // Verificar se é uma URL local/relativa
      if (imageData.startsWith('/') && !imageData.includes('://')) {
        const fullUrl = `${window.location.origin}${imageData}`;
        console.log("Converting relative URL to absolute for ImgBB upload:", fullUrl);
        imageData = fullUrl;
      }
    }

    console.log("Saving image permanently to ImgBB:", 
      typeof imageData === 'string' 
        ? imageData.substring(0, 50) + "..." 
        : `Blob (${imageData.size} bytes, type: ${imageData.type})`
    );
    
    // Tentar até 3 vezes em caso de falha
    let attempts = 0;
    let imgbbUrl = null;
    
    while (attempts < 3 && !imgbbUrl) {
      if (attempts > 0) {
        console.log(`Tentativa ${attempts + 1} de upload para ImgBB`);
        // Pequena pausa entre tentativas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      imgbbUrl = await uploadToImgBB(imageData, filename);
      attempts++;
    }
    
    if (imgbbUrl) {
      console.log("Image successfully uploaded to ImgBB:", imgbbUrl);
      // Salvar no cache local para uso futuro
      try {
        const cacheKey = `imgbb_cache_${typeof imageData === 'string' ? imageData.slice(-40) : filename || Date.now()}`;
        localStorage.setItem(cacheKey, imgbbUrl);
      } catch (e) {
        console.warn("Couldn't save to localStorage:", e);
      }

      // Também salvar a imagem como arquivo local Base64 se tivermos localStorage disponível
      try {
        if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
          // Já é base64, podemos salvar diretamente
          const base64Cache = localStorage.getItem('image_base64_cache') || '{}';
          const base64CacheObj = JSON.parse(base64Cache);
          const uniqueKey = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          base64CacheObj[uniqueKey] = imageData;
          
          // Limitar o tamanho do cache (máximo 5MB)
          const cacheString = JSON.stringify(base64CacheObj);
          if (cacheString.length < 5 * 1024 * 1024) {
            localStorage.setItem('image_base64_cache', cacheString);
          }
        } else if (typeof imageData === 'string' && imageData.startsWith('http')) {
          // Vamos tentar fazer fetch da imagem e salvar como base64
          try {
            const response = await fetch(imageData);
            if (response.ok) {
              const blob = await response.blob();
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              
              const base64Data = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
              });
              
              if (base64Data) {
                const base64Cache = localStorage.getItem('image_base64_cache') || '{}';
                const base64CacheObj = JSON.parse(base64Cache);
                const uniqueKey = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                base64CacheObj[uniqueKey] = base64Data;
                
                // Limitar o tamanho do cache (máximo 5MB)
                const cacheString = JSON.stringify(base64CacheObj);
                if (cacheString.length < 5 * 1024 * 1024) {
                  localStorage.setItem('image_base64_cache', cacheString);
                }
              }
            }
          } catch (err) {
            console.warn("Couldn't save image as base64:", err);
          }
        }
      } catch (e) {
        console.warn("Couldn't save base64 image to localStorage:", e);
      }
      
      return imgbbUrl;
    }
    
    console.error("Failed to upload image to ImgBB after multiple attempts");
    toast.error("Não foi possível salvar a imagem no ImgBB");
    
    // Verificar se temos uma versão em cache
    if (typeof imageData === 'string') {
      try {
        const cacheKey = `imgbb_cache_${imageData.slice(-40)}`;
        const cachedUrl = localStorage.getItem(cacheKey);
        if (cachedUrl) {
          console.log("Using cached ImgBB URL:", cachedUrl);
          return cachedUrl;
        }
      } catch (e) {
        console.warn("Couldn't access localStorage:", e);
      }
    }
    
    return getDefaultImageForTheme('default');
    
  } catch (error) {
    console.error("Error in saveImagePermanently:", error);
    toast.error("Erro ao salvar imagem permanentemente");
    return getDefaultImageForTheme('default');
  }
};

/**
 * Process all images in a story and save them permanently
 * @param storyData Story data object
 * @returns Updated story data with permanent image URLs
 */
export const saveStoryImagesPermanently = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    const updatedStory = { ...storyData };
    
    // Process cover image
    if (updatedStory.coverImageUrl || updatedStory.cover_image_url) {
      const coverUrl = updatedStory.coverImageUrl || updatedStory.cover_image_url;
      console.log("Saving cover image permanently:", coverUrl?.substring(0, 50) + "...");
      
      const permanentCoverUrl = await saveImagePermanently(coverUrl, `cover_${storyData.id || 'new'}`);
      updatedStory.coverImageUrl = permanentCoverUrl;
      updatedStory.cover_image_url = permanentCoverUrl;
    }
    
    // Process page images
    if (Array.isArray(updatedStory.pages)) {
      console.log(`Processing ${updatedStory.pages.length} story pages for permanent storage`);
      
      const processedPages = [];
      for (let i = 0; i < updatedStory.pages.length; i++) {
        const page = { ...updatedStory.pages[i] };
        if (page.imageUrl || page.image_url) {
          const imageUrl = page.imageUrl || page.image_url;
          console.log(`Processing page ${i+1} image: ${imageUrl?.substring(0, 30)}...`);
          
          try {
            const permanentUrl = await saveImagePermanently(
              imageUrl, 
              `page_${i+1}_${storyData.id || 'new'}`
            );
            
            page.imageUrl = permanentUrl;
            page.image_url = permanentUrl;
          } catch (pageError) {
            console.error(`Error saving page ${i+1} image:`, pageError);
            // Manter a URL original em caso de erro
          }
        }
        processedPages.push(page);
      }
      
      updatedStory.pages = processedPages;
    }
    
    // Também salvar uma cópia offline da história completa
    try {
      const offlineStoryCache = localStorage.getItem('offline_stories') || '[]';
      const offlineStories = JSON.parse(offlineStoryCache);
      
      // Remover qualquer versão antiga da mesma história
      const filteredStories = offlineStories.filter((s: any) => 
        s.id !== updatedStory.id && 
        s.title !== updatedStory.title
      );
      
      // Adicionar a história atualizada
      filteredStories.push({
        ...updatedStory,
        saved_offline_at: new Date().toISOString()
      });
      
      // Limitar a 20 histórias salvas offline
      const trimmedStories = filteredStories.slice(-20);
      
      // Salvar no localStorage
      localStorage.setItem('offline_stories', JSON.stringify(trimmedStories));
      console.log("História salva para acesso offline");
    } catch (offlineError) {
      console.warn("Não foi possível salvar história para acesso offline:", offlineError);
    }
    
    return updatedStory;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    toast.error("Erro ao processar imagens da história");
    return storyData;
  }
};

/**
 * Extrair uma imagem de uma URL e salvar como Base64
 */
export const urlToBase64 = async (url: string): Promise<string | null> => {
  if (!url) return null;
  
  if (url.startsWith('data:')) return url;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Network response was not ok');
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to Base64:", error);
    return null;
  }
};

/**
 * Salvar uma imagem da história no sistema de arquivo (como Base64 em localStorage)
 */
export const saveImageToLocalStorage = async (imageUrl: string, key: string): Promise<string | null> => {
  if (!imageUrl) return null;
  
  try {
    const base64Data = await urlToBase64(imageUrl);
    if (!base64Data) return null;
    
    const storedImages = JSON.parse(localStorage.getItem('story_images_cache') || '{}');
    storedImages[key] = base64Data;
    localStorage.setItem('story_images_cache', JSON.stringify(storedImages));
    
    return base64Data;
  } catch (error) {
    console.error("Error saving image to localStorage:", error);
    return null;
  }
};

/**
 * Busca e salva permanentemente as imagens das últimas histórias
 */
export const migrateRecentStoryImages = async (limit: number = 10): Promise<void> => {
  try {
    console.log(`Iniciando migração das imagens das ${limit} histórias mais recentes...`);
    
    // Buscar histórias do localStorage para processamento offline
    const processLocalStories = async () => {
      try {
        const keys = Object.keys(localStorage);
        const storyKeys = keys.filter(key => key.includes('storyData'));
        
        console.log(`Encontradas ${storyKeys.length} histórias no localStorage`);
        
        for (const key of storyKeys) {
          try {
            const storyJson = localStorage.getItem(key);
            if (storyJson) {
              const storyData = JSON.parse(storyJson);
              console.log(`Processando história do localStorage: ${storyData.title}`);
              
              const updatedStory = await saveStoryImagesPermanently(storyData);
              
              // Salvar história atualizada de volta no localStorage
              localStorage.setItem(key, JSON.stringify(updatedStory));
              console.log(`História ${storyData.title} atualizada com sucesso no localStorage`);
            }
          } catch (storyError) {
            console.error(`Erro ao processar história do localStorage:`, storyError);
          }
        }
      } catch (error) {
        console.error("Erro ao processar histórias do localStorage:", error);
      }
    };
    
    // Processar histórias do sessionStorage
    const processSessionStories = async () => {
      try {
        const storyData = sessionStorage.getItem("storyData");
        if (storyData) {
          console.log("Processando história da sessão atual");
          const parsedData = JSON.parse(storyData);
          const updatedStory = await saveStoryImagesPermanently(parsedData);
          
          // Salvar história atualizada de volta na sessionStorage
          sessionStorage.setItem("storyData", JSON.stringify(updatedStory));
          console.log("História da sessão atual atualizada com sucesso");
        }
      } catch (error) {
        console.error("Erro ao processar história da sessão:", error);
      }
    };
    
    // Executar o processamento
    await Promise.all([processLocalStories(), processSessionStories()]);
    
    toast.success("Migração de imagens concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a migração de imagens:", error);
    toast.error("Erro durante a migração de imagens");
  }
};

/**
 * Recuperar imagens salvas localmente
 */
export const getOfflineStories = (): any[] => {
  try {
    const offlineStoriesJson = localStorage.getItem('offline_stories');
    if (!offlineStoriesJson) return [];
    
    return JSON.parse(offlineStoriesJson);
  } catch (error) {
    console.error("Erro ao recuperar histórias offline:", error);
    return [];
  }
};

/**
 * Verificar se a história está disponível offline
 */
export const isStoryAvailableOffline = (storyId: string): boolean => {
  try {
    const offlineStories = getOfflineStories();
    return offlineStories.some(story => story.id === storyId);
  } catch (error) {
    console.error("Erro ao verificar disponibilidade offline da história:", error);
    return false;
  }
};
