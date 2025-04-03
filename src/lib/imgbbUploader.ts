
import { toast } from 'sonner';

const IMGBB_API_KEY = '8a903f565d15f4f8fbb35aaffe5665c5';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
const FALLBACK_IMAGE = '/images/defaults/default.jpg';

/**
 * Faz upload de uma imagem para o ImgBB e retorna a URL permanente
 * @param imageData URL, Base64 ou Blob da imagem
 * @param filename Nome do arquivo opcional
 * @returns Promise com a URL permanente da imagem
 */
export const uploadToImgBB = async (imageData: string | Blob, filename?: string): Promise<string | null> => {
  try {
    if (!imageData) {
      console.error("Nenhuma imagem fornecida para upload");
      return null;
    }

    console.log(`Iniciando upload para ImgBB ${typeof imageData === 'string' ? 'via URL/Base64' : 'via Blob'}`);
    
    const formData = new FormData();
    
    // Processar diferentes tipos de entrada de imagem
    if (typeof imageData === 'string') {
      // Verificar se a URL já está no ImgBB
      if (imageData.includes('i.ibb.co') || imageData.includes('image.ibb.co')) {
        console.log("Imagem já está no ImgBB:", imageData);
        return imageData;
      }
      
      // Verificar se parece ser uma URL do DALL-E/OpenAI que é conhecida por falhar
      if (imageData.includes('oaidalleapiprodscus.blob.core.windows.net') || 
          imageData.includes('openai-api-files') || 
          imageData.includes('openai.com') ||
          imageData.includes('production-files')) {
        console.log("URL da OpenAI/DALL-E detectada - estas URLs são temporárias");
        
        try {
          // Tentar buscar a imagem antes que expire
          console.log("Buscando imagem da URL temporária da OpenAI:", imageData.substring(0, 50) + "...");
          
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
          
          const response = await fetch(imageData, { 
            method: 'GET',
            cache: 'no-cache',
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          if (!response.ok) {
            throw new Error(`Falha ao buscar imagem da URL: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log(`Imagem temporária da OpenAI obtida: ${blob.size} bytes, tipo: ${blob.type}`);
          
          formData.append('image', blob);
        } catch (error) {
          console.error("Erro ao buscar imagem da URL da OpenAI:", error);
          toast.error("Erro ao buscar imagem temporária da OpenAI", {
            id: 'fetch-openai-error',
            duration: 3000
          });
          return FALLBACK_IMAGE;
        }
      } else if (imageData.startsWith('data:')) {
        // Se for uma imagem base64
        console.log("Processando imagem base64 para ImgBB");
        formData.append('image', imageData.split(',')[1] || imageData);
      } else {
        // É uma URL normal, precisamos buscar a imagem primeiro
        try {
          console.log("Buscando imagem da URL para upload:", imageData.substring(0, 50) + "...");
          
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
          
          const response = await fetch(imageData, { 
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
            },
            cache: 'no-store',
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          if (!response.ok) {
            throw new Error(`Falha ao buscar imagem da URL: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log(`Imagem obtida com sucesso: ${blob.size} bytes, tipo: ${blob.type}`);
          
          // Verificar se é uma imagem válida
          if (blob.size < 100) {
            console.error("Arquivo de imagem muito pequeno, provavelmente corrupto ou inválido");
            return FALLBACK_IMAGE;
          }
          
          formData.append('image', blob);
        } catch (error) {
          console.error("Erro ao buscar imagem da URL:", error);
          toast.error("Erro ao buscar imagem da URL", {
            id: 'fetch-image-error',
            duration: 3000
          });
          return FALLBACK_IMAGE;
        }
      }
    } else {
      // É um blob
      console.log(`Enviando blob de imagem: ${imageData.size} bytes, tipo: ${imageData.type}`);
      formData.append('image', imageData);
    }
    
    // Adicionar nome do arquivo se fornecido
    if (filename) {
      formData.append('name', filename);
    }
    
    // Adicionar a chave da API
    formData.append('key', IMGBB_API_KEY);
    
    // Fazer a requisição para o ImgBB com timeout
    console.log("Enviando imagem para ImgBB...");
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
    
    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ImgBB API respondeu com status ${response.status}:`, errorText);
      throw new Error(`ImgBB API respondeu com erro ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error("ImgBB API retornou falha:", result);
      throw new Error(result.error?.message || "Falha no upload para ImgBB");
    }
    
    console.log("Upload para ImgBB bem-sucedido:", result.data.url);
    return result.data.url;
  } catch (error) {
    console.error("Erro ao fazer upload para ImgBB:", error);
    toast.error("Falha ao fazer upload da imagem para ImgBB", {
      id: 'imgbb-error',
      duration: 3000
    });
    return FALLBACK_IMAGE; // Retornar imagem padrão em caso de erro para evitar quebra de UI
  }
};
