
import { getDefaultImageForTheme } from './defaultImages';
import { toast } from 'sonner';
import { uploadToImgBB } from './imgbbUploader';

/**
 * Salva uma imagem permanentemente usando ImgBB
 * @param imageUrl URL ou Base64 da imagem
 * @param filename Nome de arquivo personalizado opcional
 * @returns Promise com a URL permanente
 */
export const saveImagePermanently = async (imageUrl: string, filename?: string): Promise<string> => {
  if (!imageUrl) {
    console.error("No image URL provided to saveImagePermanently");
    return getDefaultImageForTheme('default');
  }

  try {
    // Verificar se a URL já está no ImgBB
    if (imageUrl.includes('i.ibb.co') || imageUrl.includes('image.ibb.co')) {
      console.log("Image is already in ImgBB storage:", imageUrl);
      return imageUrl;
    }

    // Verificar se é uma URL local/relativa
    if (imageUrl.startsWith('/') && !imageUrl.includes('://')) {
      const fullUrl = `${window.location.origin}${imageUrl}`;
      console.log("Converting relative URL to absolute for ImgBB upload:", fullUrl);
      imageUrl = fullUrl;
    }

    console.log("Saving image permanently to ImgBB:", imageUrl.substring(0, 50) + "...");
    
    // Tentar até 3 vezes em caso de falha
    let attempts = 0;
    let imgbbUrl = null;
    
    while (attempts < 3 && !imgbbUrl) {
      if (attempts > 0) {
        console.log(`Tentativa ${attempts + 1} de upload para ImgBB`);
        // Pequena pausa entre tentativas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      imgbbUrl = await uploadToImgBB(imageUrl, filename);
      attempts++;
    }
    
    if (imgbbUrl) {
      console.log("Image successfully uploaded to ImgBB:", imgbbUrl);
      // Salvar no cache local para uso futuro
      try {
        const cacheKey = `imgbb_cache_${imageUrl.slice(-40)}`;
        localStorage.setItem(cacheKey, imgbbUrl);
      } catch (e) {
        console.warn("Couldn't save to localStorage:", e);
      }
      return imgbbUrl;
    }
    
    console.error("Failed to upload image to ImgBB after multiple attempts");
    toast.error("Não foi possível salvar a imagem no ImgBB");
    
    // Verificar se temos uma versão em cache
    try {
      const cacheKey = `imgbb_cache_${imageUrl.slice(-40)}`;
      const cachedUrl = localStorage.getItem(cacheKey);
      if (cachedUrl) {
        console.log("Using cached ImgBB URL:", cachedUrl);
        return cachedUrl;
      }
    } catch (e) {
      console.warn("Couldn't access localStorage:", e);
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
    
    return updatedStory;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    toast.error("Erro ao processar imagens da história");
    return storyData;
  }
};
