
import { toast } from 'sonner';

const IMGBB_API_KEY = '8a903f565d15f4f8fbb35aaffe5665c5';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

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
      // Se for uma URL da web ou uma string base64
      if (imageData.startsWith('data:')) {
        // É uma imagem base64
        formData.append('image', imageData);
      } else {
        // É uma URL, precisamos buscar a imagem primeiro
        try {
          const response = await fetch(imageData);
          if (!response.ok) {
            throw new Error(`Falha ao buscar imagem da URL: ${response.status}`);
          }
          const blob = await response.blob();
          formData.append('image', blob);
        } catch (error) {
          console.error("Erro ao buscar imagem da URL:", error);
          return null;
        }
      }
    } else {
      // É um blob
      formData.append('image', imageData);
    }
    
    // Adicionar nome do arquivo se fornecido
    if (filename) {
      formData.append('name', filename);
    }
    
    // Adicionar a chave da API
    formData.append('key', IMGBB_API_KEY);
    
    // Fazer a requisição para o ImgBB
    console.log("Enviando imagem para ImgBB...");
    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ImgBB API respondeu com erro ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || "Falha no upload para ImgBB");
    }
    
    console.log("Upload para ImgBB bem-sucedido:", result.data.url);
    return result.data.url;
  } catch (error) {
    console.error("Erro ao fazer upload para ImgBB:", error);
    toast.error("Falha ao fazer upload da imagem para ImgBB");
    return null;
  }
};
