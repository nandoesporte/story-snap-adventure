
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
        // Handle empty or undefined URLs
        if (!imageUrl) {
          console.log("No image URL provided, using placeholder");
          setProcessedUrl('/placeholder.svg');
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
          return;
        }
        
        // Handle URL that's already in correct format
        if (imageUrl.includes('object/public')) {
          console.log("URL already in correct format:", imageUrl);
          setProcessedUrl(imageUrl);
          try {
            localStorage.setItem(cachedUrlKey, imageUrl);
          } catch (error) {
            console.error("Error saving URL to cache:", error);
          }
          setIsLoading(false);
          return;
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
        
        // Handle old Supabase storage format
        if (imageUrl.includes('supabase') && imageUrl.includes('storage') && !imageUrl.includes('object')) {
          console.log("Processing old Supabase storage URL:", imageUrl);
          try {
            const urlObj = new URL(imageUrl);
            const pathParts = urlObj.pathname.split('/');
            const fileName = pathParts[pathParts.length - 1];
            
            // Get public URL from Supabase
            const { data } = supabase
              .storage
              .from(bucketName)
              .getPublicUrl(fileName);
            
            // Verify file exists
            try {
              const { data: fileExists } = await supabase
                .storage
                .from(bucketName)
                .list('', { 
                  search: fileName 
                });
                
              if (!fileExists || fileExists.length === 0) {
                console.warn(`Image not found in storage: ${fileName}`);
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
                console.log("Processed Supabase URL:", publicUrl);
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
        setProcessedUrl('/placeholder.svg');
        setHasError(true);
        setIsLoading(false);
      }
    };

    processImageUrl();
  }, [imageUrl, bucketName]);
  
  // Hash function helper
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
