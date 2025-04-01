
import { supabase } from './supabase';
import { saveImagePermanently } from './imageStorage';

/**
 * Verifica e corrige URLs de imagens quebradas
 * @param storyId ID da história
 */
export const validateAndFixStoryImages = async (storyId: string) => {
  try {
    console.log("Validating and fixing images for story:", storyId);
    
    // Buscar a história
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
    
    if (storyError || !story) {
      console.error("Erro ao buscar história para validação de imagens:", storyError);
      return;
    }
    
    let updates = false;
    const updatedStory = { ...story };
    
    // Verificar a imagem de capa
    if (story.cover_image_url) {
      console.log("Checking cover image:", story.cover_image_url.substring(0, 50) + "...");
      const permanentCoverUrl = await saveImagePermanently(
        story.cover_image_url,
        storyId
      );
      
      if (permanentCoverUrl && permanentCoverUrl !== story.cover_image_url) {
        console.log("Updated cover image to:", permanentCoverUrl.substring(0, 50) + "...");
        updatedStory.cover_image_url = permanentCoverUrl;
        updates = true;
      }
    }
    
    // Verificar imagens das páginas
    if (Array.isArray(story.pages)) {
      console.log(`Checking ${story.pages.length} page images...`);
      
      const updatedPages = await Promise.all(story.pages.map(async (page, index) => {
        if (page.image_url) {
          console.log(`Checking page ${index + 1} image:`, page.image_url.substring(0, 50) + "...");
          
          const permanentPageUrl = await saveImagePermanently(
            page.image_url,
            `${storyId}_page${index}`
          );
          
          if (permanentPageUrl && permanentPageUrl !== page.image_url) {
            console.log(`Updated page ${index + 1} image to:`, permanentPageUrl.substring(0, 50) + "...");
            updates = true;
            return { ...page, image_url: permanentPageUrl };
          }
        }
        return page;
      }));
      
      if (updates) {
        updatedStory.pages = updatedPages;
      }
    }
    
    // Atualizar história se houver mudanças
    if (updates) {
      console.log("Updating story with permanent images...");
      
      const { error: updateError } = await supabase
        .from('stories')
        .update(updatedStory)
        .eq('id', storyId);
        
      if (updateError) {
        console.error("Erro ao atualizar URLs de imagem da história:", updateError);
      } else {
        console.log("URLs de imagem da história atualizadas com sucesso");
      }
    } else {
      console.log("No image updates needed");
    }
  } catch (e) {
    console.error("Erro ao validar e corrigir imagens da história:", e);
  }
};

/**
 * Valida e corrige uma URL de imagem
 */
export const validateImageUrl = async (
  imageUrl: string, 
  bucketName = 'story_images'
): Promise<string | null> => {
  try {
    // Já está no formato correto
    if (imageUrl.includes('object/public/story_images')) {
      return imageUrl;
    }
    
    // Tenta salvar permanentemente
    return await saveImagePermanently(imageUrl);
  } catch (e) {
    console.error("Erro ao validar URL de imagem:", e);
    return null;
  }
};

/**
 * Verifica se uma URL de imagem é um modelo de referência
 */
export const isReferenceImage = (imageUrl: string | undefined): boolean => {
  if (!imageUrl) return false;
  
  try {
    return imageUrl.includes('reference_') && 
           imageUrl.includes('object/public/story_images');
  } catch (e) {
    return false;
  }
};

/**
 * Carrega a versão em cache da imagem se disponível
 */
export const getImageFromCache = (imageUrl: string | undefined): string | null => {
  if (!imageUrl) return null;
  
  try {
    // Extrair o nome do arquivo da URL
    if (imageUrl.includes('/')) {
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      // Verificar cache
      const cachedUrl = localStorage.getItem(`image_cache_${fileName}`);
      return cachedUrl;
    }
    
    return null;
  } catch (e) {
    console.error("Erro ao buscar imagem do cache:", e);
    return null;
  }
};

/**
 * Armazena uma imagem no cache
 */
export const storeImageInCache = (imageUrl: string | undefined) => {
  if (!imageUrl) return;
  
  try {
    // Extrair o nome do arquivo da URL
    if (imageUrl.includes('/')) {
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      // Armazenar no cache
      localStorage.setItem(`image_cache_${fileName}`, imageUrl);
      console.log(`Imagem armazenada no cache: ${fileName}`);
    }
  } catch (e) {
    console.error("Erro ao armazenar imagem no cache:", e);
  }
};

/**
 * Busca a imagem de referência mais recente
 */
export const getLatestReferenceImage = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('storybot_prompts')
      .select('reference_image_url')
      .not('reference_image_url', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (error || !data || data.length === 0 || !data[0].reference_image_url) {
      return null;
    }
    
    return data[0].reference_image_url;
  } catch (e) {
    console.error("Erro ao buscar imagem de referência:", e);
    return null;
  }
};
