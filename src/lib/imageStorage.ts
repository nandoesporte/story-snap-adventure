
import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { isPermanentStorage, isTemporaryUrl } from '@/components/story-viewer/helpers';

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
      return imageUrl;
    }
    
    // Verifica o cache local primeiro
    try {
      const urlKey = imageUrl.split('/').pop()?.split('?')[0] || 
                   imageUrl.includes('oaidalleapiprodscus') ? 
                   imageUrl.match(/img-([a-zA-Z0-9]+)/)?.[1] : 
                   null;
                   
      if (urlKey) {
        const cachedUrl = localStorage.getItem(`image_cache_${urlKey}`);
        if (cachedUrl && isPermanentStorage(cachedUrl)) {
          return cachedUrl;
        }
      }
    } catch (cacheError) {
      console.error("Erro ao verificar cache:", cacheError);
    }
    
    // Gera um nome de arquivo único
    const fileExtension = 'png';
    const fileName = `${storyId || 'story'}_${uuidv4()}.${fileExtension}`;
    
    // Determina se é uma URL ou base64
    let imageBlob: Blob;
    
    if (imageUrl.startsWith('data:image')) {
      // Converte base64 para Blob
      const response = await fetch(imageUrl);
      imageBlob = await response.blob();
    } else {
      // Busca imagem da URL externa com tempo limite e várias tentativas
      let fetchAttempts = 0;
      const maxAttempts = 5;
      
      while (fetchAttempts < maxAttempts) {
        try {
          // Cria requisição com timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          // Adiciona parâmetro de cache-busting para URLs temporárias
          const fetchUrl = isTemporaryUrl(imageUrl) 
            ? `${imageUrl}&_cb=${Date.now()}`
            : imageUrl;
          
          console.log(`Tentativa ${fetchAttempts + 1}/${maxAttempts} para: ${fetchUrl}`);
          
          const response = await fetch(fetchUrl, { 
            signal: controller.signal,
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
            },
            credentials: 'omit'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Falha ao buscar imagem: ${response.status}`);
          }
          
          imageBlob = await response.blob();
          
          // Verifica se o blob é válido
          if (imageBlob.size === 0) {
            throw new Error("Blob de imagem vazio");
          }
          
          // Se chegou até aqui, temos o blob e podemos sair do loop
          break;
        } catch (fetchError) {
          fetchAttempts++;
          console.error(`Tentativa ${fetchAttempts} falhou:`, fetchError);
          
          if (fetchAttempts >= maxAttempts) {
            console.error("Número máximo de tentativas atingido");
            
            // Extrair tema da URL se possível
            let theme = 'fantasy';
            if (imageUrl.includes('theme=')) {
              theme = imageUrl.split('theme=')[1].split('&')[0];
            }
            
            // Usar imagem padrão como fallback
            return `/images/placeholders/${theme}.jpg`;
          }
          
          // Esperar antes de tentar novamente (aumento do delay)
          await new Promise(resolve => setTimeout(resolve, fetchAttempts * 1500));
        }
      }
      
      // Se não conseguiu obter o blob após todas as tentativas
      if (!imageBlob) {
        console.error("Falha ao obter a imagem após múltiplas tentativas");
        return imageUrl;
      }
    }
    
    // Carrega para o armazenamento do Supabase
    const { data, error } = await supabase
      .storage
      .from('story_images')
      .upload(fileName, imageBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: imageBlob.type || 'image/png'
      });
      
    if (error) {
      console.error("Erro ao carregar imagem para armazenamento:", error);
      return imageUrl; // Retorna URL original em caso de erro
    }
    
    // Obtém URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('story_images')
      .getPublicUrl(fileName);
      
    console.log("Imagem salva permanentemente:", publicUrl);
    
    // Armazena a URL permanente em cache
    try {
      const urlKey = imageUrl.includes('oaidalleapiprodscus') ? 
                   imageUrl.match(/img-([a-zA-Z0-9]+)/)?.[1] : 
                   imageUrl.split('/').pop()?.split('?')[0];
                   
      if (urlKey) {
        localStorage.setItem(`image_cache_${urlKey}`, publicUrl);
      }
    } catch (cacheError) {
      console.error("Erro ao armazenar URL em cache:", cacheError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error("Erro ao salvar imagem permanentemente:", error);
    return imageUrl; // Retorna URL original em caso de erro
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
    const updatedStoryData = { ...storyData };
    
    // Salva imagem de capa
    if (updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url) {
      const coverImageUrl = updatedStoryData.coverImageUrl || updatedStoryData.cover_image_url;
      try {
        const permanentCoverUrl = await saveImagePermanently(coverImageUrl, updatedStoryData.id);
        
        updatedStoryData.coverImageUrl = permanentCoverUrl;
        updatedStoryData.cover_image_url = permanentCoverUrl;
      } catch (coverError) {
        console.error("Erro ao salvar imagem de capa:", coverError);
      }
    }
    
    // Salva imagens das páginas com processamento paralelo para resultados mais rápidos
    if (Array.isArray(updatedStoryData.pages)) {
      try {
        const pagePromises = updatedStoryData.pages.map(async (page: any, index: number) => {
          const imageUrl = page.imageUrl || page.image_url;
          if (imageUrl) {
            try {
              const permanentImageUrl = await saveImagePermanently(
                imageUrl, 
                `${updatedStoryData.id || 'page'}_page${index}`
              );
              
              return {
                ...page,
                imageUrl: permanentImageUrl,
                image_url: permanentImageUrl
              };
            } catch (pageError) {
              console.error(`Erro ao salvar imagem da página ${index}:`, pageError);
              return page;
            }
          }
          return page;
        });
        
        // Processa todas as páginas em paralelo
        const results = await Promise.allSettled(pagePromises);
        
        // Atualiza apenas as páginas que foram processadas com sucesso
        updatedStoryData.pages = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          // Mantém a página original se houve erro
          return updatedStoryData.pages[index];
        });
      } catch (pagesError) {
        console.error("Erro ao processar imagens das páginas:", pagesError);
      }
    }
    
    return updatedStoryData;
  } catch (error) {
    console.error("Erro ao salvar imagens da história permanentemente:", error);
    return storyData; // Retorna dados originais em caso de erro
  }
};
