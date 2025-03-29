
import { supabase } from './supabase';

/**
 * Verifica e corrige URLs de imagens quebradas
 * @param storyId ID da história
 */
export const validateAndFixStoryImages = async (storyId: string) => {
  try {
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
      const fixedCoverUrl = await validateImageUrl(story.cover_image_url, 'story_images');
      if (fixedCoverUrl && fixedCoverUrl !== story.cover_image_url) {
        updatedStory.cover_image_url = fixedCoverUrl;
        updates = true;
      }
    }
    
    // Verificar imagens das páginas
    if (Array.isArray(story.pages)) {
      const updatedPages = await Promise.all(story.pages.map(async (page) => {
        if (page.image_url) {
          const fixedPageUrl = await validateImageUrl(page.image_url, 'story_images');
          if (fixedPageUrl && fixedPageUrl !== page.image_url) {
            updates = true;
            return { ...page, image_url: fixedPageUrl };
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
      const { error: updateError } = await supabase
        .from('stories')
        .update(updatedStory)
        .eq('id', storyId);
        
      if (updateError) {
        console.error("Erro ao atualizar URLs de imagem da história:", updateError);
      } else {
        console.log("URLs de imagem da história atualizadas com sucesso");
      }
    }
  } catch (e) {
    console.error("Erro ao validar e corrigir imagens da história:", e);
  }
};

/**
 * Valida e corrige uma URL de imagem
 */
const validateImageUrl = async (
  imageUrl: string, 
  bucketName = 'story_images'
): Promise<string | null> => {
  try {
    // Já está no formato correto
    if (imageUrl.includes('object/public')) {
      return imageUrl;
    }
    
    // É uma URL de armazenamento do Supabase que precisa ser corrigida
    if (imageUrl.includes('supabase') && imageUrl.includes('storage') && !imageUrl.includes('object')) {
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      // Use getPublicUrl para obter a URL correta
      const { data } = supabase
        .storage
        .from(bucketName)
        .getPublicUrl(fileName);
        
      return data.publicUrl;
    }
    
    // Outros formatos de URL mantemos como estão
    return imageUrl;
  } catch (e) {
    console.error("Erro ao validar URL de imagem:", e);
    return null;
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
export const storeImageInCache = (imageUrl: string) => {
  try {
    if (!imageUrl) return;
    
    // Extrair o nome do arquivo da URL
    if (imageUrl.includes('/')) {
      const parts = imageUrl.split('/');
      const fileName = parts[parts.length - 1];
      
      // Armazenar no cache
      localStorage.setItem(`image_cache_${fileName}`, imageUrl);
    }
  } catch (e) {
    console.error("Erro ao armazenar imagem no cache:", e);
  }
};
