
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface CoverImageProps {
  imageUrl: string;
  fallbackImage: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
}

export const CoverImage: React.FC<CoverImageProps> = ({
  imageUrl,
  fallbackImage,
  alt,
  className = '',
  onClick,
  onError
}) => {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [finalUrl, setFinalUrl] = useState<string>(imageUrl);
  const timeoutRef = useRef<number | null>(null);
  
  // Reset state when image URL changes
  useEffect(() => {
    setImgError(false);
    setLoaded(false);
    setRetryCount(0);
    setFinalUrl(imageUrl);
    
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [imageUrl]);
  
  // Cache successful image URLs for better performance
  useEffect(() => {
    if (loaded && finalUrl) {
      try {
        const cacheKey = `image_cache_${finalUrl.split('/').pop()}`;
        if (!localStorage.getItem(cacheKey)) {
          localStorage.setItem(cacheKey, finalUrl);
        }
      } catch (error) {
        // Silent fail for localStorage errors
      }
    }
  }, [loaded, finalUrl]);
  
  // Pre-load the image to verify if it's valid
  useEffect(() => {
    if (finalUrl && !loaded && !imgError && retryCount < 2) {
      const img = new Image();
      img.src = finalUrl;
      
      // Set a timeout to catch slow-loading images
      timeoutRef.current = window.setTimeout(() => {
        if (!loaded) {
          console.warn(`Image load timeout: ${finalUrl}`);
          if (retryCount < 1) {
            // Try once more with cache busting
            setRetryCount(prev => prev + 1);
            const retryUrl = finalUrl.includes('?') 
              ? `${finalUrl}&retry=${Date.now()}` 
              : `${finalUrl}?retry=${Date.now()}`;
            setFinalUrl(retryUrl);
          } else {
            setImgError(true);
            if (onError) onError();
          }
        }
      }, 8000); // 8 second timeout
      
      const handleLoad = () => {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setLoaded(true);
        console.log("Image pre-loaded successfully:", finalUrl);
      };
      
      const handleError = () => {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        console.error(`Failed to pre-load image: ${finalUrl}`);
        
        if (retryCount < 1 && !finalUrl.includes('placeholder')) {
          // Try once more with a small delay
          setRetryCount(prev => prev + 1);
          
          // Add cache-busting parameter
          const retryUrl = finalUrl.includes('?') 
            ? `${finalUrl}&retry=${Date.now()}` 
            : `${finalUrl}?retry=${Date.now()}`;
            
          setFinalUrl(retryUrl);
        } else {
          setImgError(true);
          if (onError) onError();
        }
      };
      
      img.onload = handleLoad;
      img.onerror = handleError;
      
      return () => {
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [finalUrl, onError, loaded, imgError, retryCount]);
  
  // Handle image loading error
  const handleError = () => {
    console.error(`Failed to load image: ${finalUrl}`);
    
    if (retryCount < 1 && !finalUrl.includes('placeholder')) {
      // Try once more
      setRetryCount(prev => prev + 1);
      
      // Add cache-busting parameter if not already present
      const retryUrl = finalUrl.includes('?') 
        ? `${finalUrl}&retry=${Date.now()}` 
        : `${finalUrl}?retry=${Date.now()}`;
      
      setFinalUrl(retryUrl);
    } else {
      setImgError(true);
      // Cache the fallback image for future reference
      try {
        localStorage.setItem(`image_cache_fallback_${imageUrl.split('/').pop()}`, fallbackImage);
      } catch (error) {
        console.error("Error saving fallback to cache:", error);
      }
      if (onError) onError();
    }
  };

  const handleLoad = () => {
    setLoaded(true);
    console.log("Image loaded successfully:", finalUrl);
  };

  // Use the fallback image if there was an error
  const displayUrl = imgError ? fallbackImage : finalUrl;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{width: '100%', height: '100%'}}>
      {(!loaded && !imgError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-gray-600 text-sm">Carregando imagem...</span>
          </div>
        </div>
      )}
      <img
        src={displayUrl}
        alt={alt}
        className={`transition-opacity duration-300 ${!loaded && !imgError ? 'opacity-0' : 'opacity-100'} w-full h-full object-cover`}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        style={{objectFit: 'cover', width: '100%', height: '100%'}}
      />
      {imgError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
          <img 
            src={fallbackImage} 
            alt={`Fallback for ${alt}`}
            className="w-full h-full object-cover"
            onError={() => {
              console.error("Even fallback image failed to load");
              toast.error("Falha ao carregar imagem", {
                description: "Tente recarregar a página"
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CoverImage;
