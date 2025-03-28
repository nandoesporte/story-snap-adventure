
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
            const storageUrl = `${supabase.storageUrl}/object/public/${bucketName}/${fileName}`;
            
            // Verificar se o arquivo existe
            const { data, error } = await supabase
              .storage
              .from(bucketName)
              .download(fileName);
              
            if (error) {
              console.warn(`Image not found in storage: ${fileName}`, error);
              setProcessedUrl('/placeholder.svg');
              setHasError(true);
            } else {
              setProcessedUrl(storageUrl);
            }
          } catch (error) {
            console.error('Failed to process storage URL:', error);
            setProcessedUrl('/placeholder.svg');
            setHasError(true);
          }
          return;
        }
        
        // Se é um caminho local ou URL externa
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

  return { processedUrl, isLoading, hasError };
};
