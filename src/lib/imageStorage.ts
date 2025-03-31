
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Salva uma imagem no bucket de armazenamento permanente
 * @param imageUrl URL ou Base64 da imagem
 * @param storyId ID da história (opcional)
 * @returns Promise com a URL permanente
 */
export const saveImagePermanently = async (imageUrl: string, storyId?: string): Promise<string> => {
  try {
    // Se já for uma URL do bucket de armazenamento, retorne
    if (imageUrl.includes('supabase.co/storage/v1/object/public/story_images')) {
      console.log("Image is already in permanent storage:", imageUrl);
      return imageUrl;
    }
    
    // Gerar um nome único para o arquivo
    const fileExtension = 'png';
    const fileName = `${storyId || 'story'}_${uuidv4()}.${fileExtension}`;
    
    // Determinar se é uma URL ou base64
    let imageBlob: Blob;
    
    if (imageUrl.startsWith('data:image')) {
      // Converter base64 para Blob
      const response = await fetch(imageUrl);
      imageBlob = await response.blob();
    } else {
      // Buscar imagem de URL externa
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
        
        const response = await fetch(imageUrl, { 
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        imageBlob = await response.blob();
      } catch (fetchError) {
        console.error("Error fetching image from URL:", fetchError);
        // Retornar URL original em caso de erro
        return imageUrl;
      }
    }
    
    // Fazer upload para o bucket do Supabase
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
      return imageUrl; // Em caso de erro, manter a URL original
    }
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(fileName);
      
    console.log("Image saved permanently:", publicUrl);
    return publicUrl;
  } catch (error) {
    console.error("Error saving image permanently:", error);
    return imageUrl; // Em caso de erro, manter a URL original
  }
};

/**
 * Converte todas as imagens de uma história para armazenamento permanente
 * @param storyData Dados da história
 * @returns Promise com os dados da história atualizados
 */
export const saveStoryImagesPermanently = async (storyData: any): Promise<any> => {
  if (!storyData) return storyData;
  
  try {
    const updatedStoryData = { ...storyData };
    
    // Salvar imagem de capa
    if (updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url) {
      const coverImageUrl = updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url;
      const permanentCoverUrl = await saveImagePermanently(coverImageUrl, updatedStoryData.id);
      
      updatedStoryData.coverImageUrl = permanentCoverUrl;
      updatedStoryData.cover_image_url = permanentCoverUrl;
    }
    
    // Salvar imagens das páginas
    if (Array.isArray(updatedStoryData.pages)) {
      updatedStoryData.pages = await Promise.all(updatedStoryData.pages.map(async (page: any, index: number) => {
        const imageUrl = page.imageUrl || page.image_url;
        if (imageUrl) {
          const permanentImageUrl = await saveImagePermanently(
            imageUrl, 
            `${updatedStoryData.id}_page${index}`
          );
          
          return {
            ...page,
            imageUrl: permanentImageUrl,
            image_url: permanentImageUrl
          };
        }
        return page;
      }));
    }
    
    return updatedStoryData;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    return storyData; // Em caso de erro, manter os dados originais
  }
};
