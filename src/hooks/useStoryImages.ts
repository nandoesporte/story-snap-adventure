
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Este hook ajuda a garantir que as URLs das imagens das histórias sejam válidas e persistentes
export const useStoryImages = (imageUrl: string | undefined, bucketName = 'story_images') => {
  const [processedUrl, setProcessedUrl] = useState<string>(imageUrl || '/placeholder.svg');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const processImageUrl = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        if (!imageUrl) {
          setProcessedUrl('/placeholder.svg');
          setHasError(true);
          return;
        }

        // Se já é uma URL completa com o formato correto de objeto de armazenamento
        if (imageUrl.includes('object/public')) {
          setProcessedUrl(imageUrl);
          return;
        }
        
        // Se é uma URL de armazenamento do Supabase, mas com formato antigo
        if (imageUrl.includes('supabase') && imageUrl.includes('storage') && !imageUrl.includes('object')) {
          try {
            const urlObj = new URL(imageUrl);
            const pathParts = urlObj.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            
            // Use getPublicUrl method instead of direct property access
            const { data } = supabase
              .storage
              .from(bucketName)
              .getPublicUrl(fileName);
            
            // Verificar se o arquivo existe
            const { data: fileExists, error: checkError } = await supabase
              .storage
              .from(bucketName)
              .list('', { 
                search: fileName 
              });
              
            if (checkError || !fileExists || fileExists.length === 0) {
              console.warn(`Image not found in storage: ${fileName}`, checkError);
              // Tente buscar do cache se disponível
              const cachedUrl = localStorage.getItem(`image_cache_${fileName}`);
              if (cachedUrl) {
                setProcessedUrl(cachedUrl);
                return;
              }
              setProcessedUrl('/placeholder.svg');
              setHasError(true);
            } else {
              const publicUrl = data.publicUrl;
              // Armazenar no cache local
              localStorage.setItem(`image_cache_${fileName}`, publicUrl);
              setProcessedUrl(publicUrl);
            }
          } catch (error) {
            console.error('Failed to process storage URL:', error);
            setProcessedUrl('/placeholder.svg');
            setHasError(true);
          }
          return;
        }
        
        // Se é um caminho local ou URL externa
        if (imageUrl.startsWith('data:image')) {
          // Caso seja uma imagem base64, vamos armazená-la no cache local
          const hash = await hashString(imageUrl.substring(0, 100)); // Usamos apenas o início para economizar espaço
          localStorage.setItem(`image_cache_${hash}`, imageUrl);
        }
        
        setProcessedUrl(imageUrl);
      } catch (error) {
        console.error('Error processing image URL:', error);
        setProcessedUrl('/placeholder.svg');
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    processImageUrl();
  }, [imageUrl, bucketName]);
  
  // Função auxiliar para criar um hash de uma string
  const hashString = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  return { processedUrl, isLoading, hasError };
};
