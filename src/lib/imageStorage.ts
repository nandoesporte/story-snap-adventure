
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { isPermanentStorage, isTemporaryUrl } from '@/components/story-viewer/helpers';
import { toast } from 'sonner';

/**
 * Salva uma imagem no armazenamento permanente
 * @param imageUrl URL ou Base64 da imagem
 * @param storyId ID da história (opcional)
 * @returns Promise com a URL permanente
 */
export const saveImagePermanently = async (imageUrl: string, storyId?: string): Promise<string> => {
  try {
    // Se já for uma URL do armazenamento permanente, retorna
    if (isPermanentStorage(imageUrl)) {
      console.log("Image is already in permanent storage:", imageUrl);
      return imageUrl;
    }
    
    // Verifica o cache local primeiro
    try {
      const urlKey = imageUrl.split('/').pop()?.split('?')[0];
      if (urlKey) {
        const cachedUrl = localStorage.getItem(`image_cache_${urlKey}`);
        if (cachedUrl && isPermanentStorage(cachedUrl)) {
          console.log("Using cached permanent URL:", cachedUrl);
          return cachedUrl;
        }
      }
    } catch (cacheError) {
      console.error("Erro ao verificar cache:", cacheError);
    }
    
    console.log("Saving image permanently from URL:", imageUrl.substring(0, 50) + "...");
    
    // Gera um nome de arquivo único
    const fileExtension = 'png';
    const fileName = `${storyId || 'story'}_${uuidv4()}.${fileExtension}`;
    
    // Determina se é uma URL ou base64
    let imageBlob: Blob;
    
    if (imageUrl.startsWith('data:image')) {
      // Converte base64 para Blob
      const response = await fetch(imageUrl);
      imageBlob = await response.blob();
      console.log("Converted base64 to Blob, size:", imageBlob.size);
    } else {
      // Busca imagem da URL externa com tempo limite
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos de timeout
        
        // Adiciona parâmetro de cache-busting para URLs temporárias
        const fetchUrl = isTemporaryUrl(imageUrl) 
          ? `${imageUrl}&_cb=${Date.now()}`
          : imageUrl;
        
        console.log("Fetching image from URL:", fetchUrl.substring(0, 50) + "...");
        
        // Try to fetch with credentials
        const response = await fetch(fetchUrl, { 
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          credentials: 'same-origin'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        imageBlob = await response.blob();
        console.log("Fetched image as Blob, size:", imageBlob.size);
      } catch (fetchError) {
        console.error("Error fetching image from URL:", fetchError);
        
        // If this is a potentially expired URL and we failed to fetch it,
        // use a default theme image
        if (isTemporaryUrl(imageUrl)) {
          console.log("Using default theme image instead of expired temporary URL");
          const theme = storyId?.includes('space') ? 'space' : 
                       storyId?.includes('ocean') ? 'ocean' :
                       storyId?.includes('fantasy') ? 'fantasy' :
                       storyId?.includes('adventure') ? 'adventure' :
                       storyId?.includes('dinosaurs') ? 'dinosaurs' : 'default';
                       
          const defaultImagePath = `/images/defaults/${theme}.jpg`;
          
          // Try to fetch the default image
          try {
            const defaultResponse = await fetch(defaultImagePath);
            if (!defaultResponse.ok) throw new Error("Default image not available");
            
            imageBlob = await defaultResponse.blob();
            console.log("Using default image instead, size:", imageBlob.size);
          } catch (defaultError) {
            console.error("Error fetching default image:", defaultError);
            return `/images/defaults/${theme}.jpg`; // Return path directly if we can't fetch it
          }
        } else {
          // Return original URL if it's not a temporary URL
          return imageUrl;
        }
      }
    }
    
    // Verificar se o blob tem conteúdo válido
    if (!imageBlob || imageBlob.size < 100) {
      console.error("Invalid or too small blob:", imageBlob?.size);
      
      // Use default image if blob is invalid
      const theme = 'default';
      const defaultImagePath = `/images/defaults/${theme}.jpg`;
      return defaultImagePath;
    }
    
    console.log("Uploading image to Supabase storage:", fileName);
    
    // Carrega para o armazenamento do Supabase
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/png'
      });
      
    if (error) {
      console.error("Error uploading image to storage:", error);
      
      // Return a default image path if upload fails
      const theme = 'default';
      const defaultImagePath = `/images/defaults/${theme}.jpg`;
      return defaultImagePath;
    }
    
    // Obtém URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(fileName);
      
    console.log("Image saved permanently:", publicUrl);
    
    // Armazena a URL permanente em cache
    try {
      const urlKey = imageUrl.split('/').pop()?.split('?')[0];
      if (urlKey) {
        localStorage.setItem(`image_cache_${urlKey}`, publicUrl);
        console.log("URL cached for future reference");
      }
    } catch (cacheError) {
      console.error("Error storing URL in cache:", cacheError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error("Error saving image permanently:", error);
    
    // Use default theme image as fallback
    const theme = 'default';
    const defaultImagePath = `/images/defaults/${theme}.jpg`;
    return defaultImagePath;
  }
};

/**
 * Converte todas as imagens em uma história para armazenamento permanente
 * @param storyData Dados da história
 * @returns Promise com dados da história atualizados
 */
export const saveStoryImagesPermanently = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    console.log("Saving all story images permanently for story:", storyData.id || "new story");
    
    const updatedStoryData = { ...storyData };
    
    // Salva imagem de capa
    if (updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url) {
      const coverImageUrl = updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url;
      try {
        console.log("Processing cover image...");
        const permanentCoverUrl = await saveImagePermanently(coverImageUrl, updatedStoryData.id);
        
        updatedStoryData.coverImageUrl = permanentCoverUrl;
        updatedStoryData.cover_image_url = permanentCoverUrl;
        console.log("Cover image processed successfully");
      } catch (coverError) {
        console.error("Error saving cover image:", coverError);
      }
    }
    
    // Process pages in sequence rather than parallel for better reliability
    if (Array.isArray(updatedStoryData.pages)) {
      try {
        console.log(`Processing ${updatedStoryData.pages.length} page images sequentially...`);
        
        for (let index = 0; index < updatedStoryData.pages.length; index++) {
          const page = updatedStoryData.pages[index];
          const imageUrl = page.imageUrl || page.image_url;
          
          if (imageUrl) {
            try {
              console.log(`Processing page ${index + 1} image...`);
              
              // Add a small delay between each image to avoid rate limiting
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
              const permanentImageUrl = await saveImagePermanently(
                imageUrl, 
                `${updatedStoryData.id || 'page'}_page${index}`
              );
              
              // Update the page with permanent image URL
              updatedStoryData.pages[index] = {
                ...page,
                imageUrl: permanentImageUrl,
                image_url: permanentImageUrl
              };
              
              console.log(`Page ${index + 1} image processed successfully`);
            } catch (pageError) {
              console.error(`Error saving image for page ${index}:`, pageError);
            }
          }
        }
        
        console.log("All page images processed");
      } catch (pagesError) {
        console.error("Error processing page images:", pagesError);
      }
    }
    
    return updatedStoryData;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    return storyData; // Return original data on error
  }
};

/**
 * Verifies if an image URL exists
 * @param url The URL to check
 * @returns Promise that resolves to boolean
 */
export const verifyImageUrl = async (url: string): Promise<boolean> => {
  if (!url || url.startsWith('data:')) return true;
  
  try {
    // Add cache-busting for potentially cached expired URLs
    const fetchUrl = isTemporaryUrl(url) ? `${url}&_cb=${Date.now()}` : url;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(fetchUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Error verifying image URL:", error);
    return false;
  }
};
