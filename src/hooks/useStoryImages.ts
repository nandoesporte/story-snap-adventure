
import { useState, useEffect } from 'react';
import { saveImagePermanently } from '@/lib/imageStorage';

// Este hook ajuda a garantir que as URLs das imagens das histórias sejam válidas e permanentes
export const useStoryImages = (imageUrl: string | undefined) => {
  const [processedUrl, setProcessedUrl] = useState<string>(imageUrl || '/images/defaults/default.jpg');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isPermanent, setIsPermanent] = useState<boolean>(false);

  useEffect(() => {
    const processImageUrl = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // Handle empty or undefined URLs
        if (!imageUrl) {
          console.log("No image URL provided, using placeholder");
          setProcessedUrl('/images/defaults/default.jpg');
          setHasError(true);
          setIsLoading(false);
          return;
        }

        console.log("Processing image URL:", imageUrl);
        
        // Check for cached version first
        const cachedUrlKey = `image_cache_${imageUrl.split('/').pop()}`;
        const cachedUrl = localStorage.getItem(cachedUrlKey);
        if (cachedUrl) {
          console.log("Using cached image URL:", cachedUrl);
          setProcessedUrl(cachedUrl);
          setIsLoading(false);
          
          // Verificar se a URL é do ImgBB
          if (cachedUrl.includes('i.ibb.co') || cachedUrl.includes('image.ibb.co')) {
            setIsPermanent(true);
          }
          return;
        }
        
        // Handle URL that's already in ImgBB
        if (imageUrl.includes('i.ibb.co') || imageUrl.includes('image.ibb.co')) {
          console.log("URL already in ImgBB:", imageUrl);
          setProcessedUrl(imageUrl);
          setIsPermanent(true);
          try {
            localStorage.setItem(cachedUrlKey, imageUrl);
          } catch (error) {
            console.error("Error saving URL to cache:", error);
          }
          setIsLoading(false);
          return;
        }
        
        // Try to save image permanently with ImgBB
        if (!isPermanent) {
          try {
            console.log("Attempting to save image permanently with ImgBB:", imageUrl);
            const permanentUrl = await saveImagePermanently(imageUrl);
            
            if (permanentUrl !== imageUrl) {
              console.log("Image saved to ImgBB:", permanentUrl);
              setProcessedUrl(permanentUrl);
              setIsPermanent(true);
              try {
                localStorage.setItem(cachedUrlKey, permanentUrl);
              } catch (cacheError) {
                console.error("Error saving URL to cache:", cacheError);
              }
              setIsLoading(false);
              return;
            }
          } catch (saveError) {
            console.error("Error saving image to ImgBB:", saveError);
            // Continue with fallback methods if permanent save fails
          }
        }
        
        // Handle temporary OpenAI/DALL-E URLs
        if (imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
          console.log("Processing OpenAI image URL:", imageUrl);
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(imageUrl, { 
              method: 'HEAD',
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              setProcessedUrl(imageUrl);
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
              setProcessedUrl('/images/defaults/default.jpg');
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
            setProcessedUrl('/images/defaults/default.jpg');
            setIsLoading(false);
            return;
          }
        }
        
        // Handle static image paths in the project
        if (imageUrl.startsWith('/images/') || imageUrl === '/placeholder.svg') {
          console.log("Processing static image path:", imageUrl);
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
        
        // Handle base64 images
        if (imageUrl.startsWith('data:image')) {
          console.log("Processing base64 image");
          const hash = await hashString(imageUrl.substring(0, 100));
          try {
            localStorage.setItem(`image_cache_${hash}`, imageUrl);
          } catch (error) {
            console.error("Error saving base64 to cache:", error);
          }
          setProcessedUrl(imageUrl);
          setIsLoading(false);
          return;
        }
        
        // Handle relative URLs
        if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
          console.log("Processing relative URL:", imageUrl);
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
        
        // Handle any other external URL
        console.log("Using external URL as-is:", imageUrl);
        setProcessedUrl(imageUrl);
        try {
          localStorage.setItem(cachedUrlKey, imageUrl);
        } catch (error) {
          console.error("Error saving URL to cache:", error);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error processing image URL:', error);
        setProcessedUrl('/images/defaults/default.jpg');
        setHasError(true);
        setIsLoading(false);
      }
    };

    processImageUrl();
  }, [imageUrl, isPermanent]);
  
  // Hash function helper
  const hashString = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  return { 
    processedUrl, 
    isLoading, 
    hasError, 
    isPermanent 
  };
};
