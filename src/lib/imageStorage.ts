
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

    console.log("Saving image permanently to ImgBB:", imageUrl.substring(0, 50) + "...");
    
    // Fazer upload para o ImgBB
    const imgbbUrl = await uploadToImgBB(imageUrl, filename);
    
    if (imgbbUrl) {
      console.log("Image successfully uploaded to ImgBB:", imgbbUrl);
      return imgbbUrl;
    }
    
    console.error("Failed to upload image to ImgBB");
    toast.error("Não foi possível salvar a imagem no ImgBB");
    return getDefaultImageForTheme('default');
    
  } catch (error) {
    console.error("Error in saveImagePermanently:", error);
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
      const permanentCoverUrl = await saveImagePermanently(coverUrl, `cover_${storyData.id || 'new'}`);
      updatedStory.coverImageUrl = permanentCoverUrl;
      updatedStory.cover_image_url = permanentCoverUrl;
    }
    
    // Process page images
    if (Array.isArray(updatedStory.pages)) {
      console.log(`Processing ${updatedStory.pages.length} story pages for permanent storage`);
      
      for (let i = 0; i < updatedStory.pages.length; i++) {
        const page = updatedStory.pages[i];
        if (page.imageUrl || page.image_url) {
          const imageUrl = page.imageUrl || page.image_url;
          console.log(`Processing page ${i+1} image: ${imageUrl?.substring(0, 30)}...`);
          
          const permanentUrl = await saveImagePermanently(
            imageUrl, 
            `page_${i+1}_${storyData.id || 'new'}`
          );
          
          updatedStory.pages[i] = {
            ...page,
            imageUrl: permanentUrl,
            image_url: permanentUrl
          };
        }
      }
    }
    
    return updatedStory;
  } catch (error) {
    console.error("Error saving story images permanently:", error);
    return storyData;
  }
};
