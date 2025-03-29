
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

        // Primeiro verifique se temos uma versão em cache local
        const cachedUrlKey = `image_cache_${imageUrl.split('/').pop()}`;
        const cachedUrl = localStorage.getItem(cachedUrlKey);
        if (cachedUrl) {
          console.log("Using cached image URL:", cachedUrl);
          setProcessedUrl(cachedUrl);
          setIsLoading(false);
          return;
        }
        
        // Verifica se a URL já está no formato correto
        if (imageUrl.includes('object/public')) {
          setProcessedUrl(imageUrl);
          try {
            localStorage.setItem(cachedUrlKey, imageUrl);
          } catch (error) {
            console.error("Error saving URL to cache:", error);
          }
          setIsLoading(false);
          return;
        }
        
        // Se é uma URL temporária de DALL-E/OpenAI
        if (imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
          // Verificar se expirou tentando fazer um fetch
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(imageUrl, { 
              method: 'HEAD',
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              setProcessedUrl(imageUrl);
              // Armazenar no cache local
              try {
                localStorage.setItem(cachedUrlKey, imageUrl);
              } catch (error) {
                console.error("Error saving URL to cache:", error);
              }
              setIsLoading(false);
              return;
            } else {
              console.warn('OpenAI image URL expired:', imageUrl);
              const fallbackCacheKey = `image_cache_fallback_${imageUrl.split('/').pop()}`;
              const fallbackUrl = localStorage.getItem(fallbackCacheKey);
              if (fallbackUrl) {
                setProcessedUrl(fallbackUrl);
                setIsLoading(false);
                return;
              }
              setHasError(true);
              setProcessedUrl('/placeholder.svg');
              setIsLoading(false);
              return;
            }
          } catch (fetchError) {
            console.error('Failed to fetch OpenAI image:', fetchError);
            const fallbackCacheKey = `image_cache_fallback_${imageUrl.split('/').pop()}`;
            const fallbackUrl = localStorage.getItem(fallbackCacheKey);
            if (fallbackUrl) {
              setProcessedUrl(fallbackUrl);
              setIsLoading(false);
              return;
            }
            setHasError(true);
            setProcessedUrl('/placeholder.svg');
            setIsLoading(false);
            return;
          }
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
            try {
              const { data: fileExists } = await supabase
                .storage
                .from(bucketName)
                .list('', { 
                  search: fileName 
                });
                
              if (!fileExists || fileExists.length === 0) {
                console.warn(`Image not found in storage: ${fileName}`);
                // Tente buscar do cache se disponível
                const cachedUrl = localStorage.getItem(`image_cache_${fileName}`);
                if (cachedUrl) {
                  setProcessedUrl(cachedUrl);
                  setIsLoading(false);
                  return;
                }
                setProcessedUrl('/placeholder.svg');
                setHasError(true);
              } else {
                const publicUrl = data.publicUrl;
                // Armazenar no cache local
                try {
                  localStorage.setItem(`image_cache_${fileName}`, publicUrl);
                } catch (error) {
                  console.error("Error saving URL to cache:", error);
                }
                setProcessedUrl(publicUrl);
              }
            } catch (checkError) {
              console.error("Error checking file existence:", checkError);
              setProcessedUrl('/placeholder.svg');
              setHasError(true);
            }
          } catch (error) {
            console.error('Failed to process storage URL:', error);
            setProcessedUrl('/placeholder.svg');
            setHasError(true);
          }
          setIsLoading(false);
          return;
        }
        
        // Se é um caminho local ou URL externa
        if (imageUrl.startsWith('data:image')) {
          // Caso seja uma imagem base64, vamos armazená-la no cache local
          const hash = await hashString(imageUrl.substring(0, 100)); // Usamos apenas o início para economizar espaço
          try {
            localStorage.setItem(`image_cache_${hash}`, imageUrl);
          } catch (error) {
            console.error("Error saving base64 to cache:", error);
          }
          setProcessedUrl(imageUrl);
          setIsLoading(false);
          return;
        }
        
        // Para URLs relativas, adicione o origin
        if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
          const fullUrl = `${window.location.origin}${imageUrl}`;
          setProcessedUrl(fullUrl);
          try {
            localStorage.setItem(cachedUrlKey, fullUrl);
          } catch (error) {
            console.error("Error saving URL to cache:", error);
          }
          setIsLoading(false);
          return;
        }
        
        // Para qualquer outro tipo de URL externa
        setProcessedUrl(imageUrl);
        try {
          localStorage.setItem(cachedUrlKey, imageUrl);
        } catch (error) {
          console.error("Error saving URL to cache:", error);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing image URL:', error);
        setProcessedUrl('/placeholder.svg');
        setHasError(true);
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
