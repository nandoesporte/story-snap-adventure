
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { getDefaultImageForTheme } from './defaultImages';
import { setupStorageBuckets } from './storageBucketSetup';
import { toast } from 'sonner';
import { uploadToImgBB } from './imgbbUploader';

/**
 * Salva uma imagem permanentemente usando ImgBB primeiro, e como fallback no Supabase
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
    // Verificar se a URL já está em nosso armazenamento
    if (imageUrl.includes('supabase.co/storage/v1/object/public/story_images') || 
        imageUrl.includes('i.ibb.co') || 
        imageUrl.includes('image.ibb.co')) {
      console.log("Image is already in permanent storage:", imageUrl);
      return imageUrl;
    }

    console.log("Saving image permanently:", imageUrl.substring(0, 50) + "...");
    
    // Primeiro tenta fazer upload para o ImgBB
    const imgbbUrl = await uploadToImgBB(imageUrl, filename);
    
    if (imgbbUrl) {
      console.log("Image successfully uploaded to ImgBB:", imgbbUrl);
      return imgbbUrl;
    }
    
    console.log("Falling back to Supabase storage...");
    
    // Se falhar, cai para o Supabase como fallback
    // Configurar o bucket se não existir
    const bucketSetup = await setupStorageBuckets();
    if (!bucketSetup) {
      console.error("Failed to set up storage bucket");
      toast.error("Falha ao configurar armazenamento de imagens");
      return getDefaultImageForTheme('default');
    }
    
    let blob: Blob;
    
    // Lidar com URLs de dados base64
    if (imageUrl.startsWith('data:')) {
      try {
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } catch (error) {
        console.error("Error converting base64 to blob:", error);
        return getDefaultImageForTheme('default');
      }
    } 
    // Lidar com URLs remotas
    else {
      try {
        const res = await fetch(imageUrl, {
          headers: {
            'Accept': 'image/*, */*'
          },
          cache: 'no-cache'
        });
        if (!res.ok) {
          console.error("Failed to fetch image:", res.status, res.statusText);
          return getDefaultImageForTheme('default');
        }
        blob = await res.blob();
      } catch (error) {
        console.error("Error fetching image URL:", error);
        return getDefaultImageForTheme('default');
      }
    }
    
    if (!blob || blob.size === 0) {
      console.error("Invalid blob - empty or null");
      return getDefaultImageForTheme('default');
    }
    
    // Gerar nome de arquivo único
    const fileExt = blob.type.split('/')[1] || 'png';
    const uniqueFilename = filename ? 
      `${filename.replace(/\s+/g, '_')}_${uuidv4().substring(0, 8)}.${fileExt}` : 
      `image_${uuidv4()}.${fileExt}`;
    
    // Upload para Supabase
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(uniqueFilename, blob, {
        contentType: blob.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Error uploading to Supabase:", error);
      
      // Se o erro é porque o arquivo já existe, tente obter a URL pública de qualquer maneira
      if (error.message && error.message.includes('already exists')) {
        const { data: existingData } = supabase
          .storage
          .from('story_images')
          .getPublicUrl(uniqueFilename);
          
        console.log("Retrieved URL for existing file:", existingData.publicUrl);
        return existingData.publicUrl;
      }
      
      return getDefaultImageForTheme('default');
    }
    
    // Obter a URL pública
    const { data: publicUrlData } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(uniqueFilename);
    
    console.log("Image saved to permanent storage:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
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
