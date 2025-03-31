
import React, { useState, useEffect } from 'react';
import { isPermanentStorage, isTemporaryUrl } from './story-viewer/helpers';

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
  
  // Reset state when image URL changes
  useEffect(() => {
    setImgError(false);
    setLoaded(false);
    setRetryCount(0);
    setFinalUrl(imageUrl);
  }, [imageUrl]);
  
  // Check if URL is cached
  useEffect(() => {
    if (finalUrl) {
      try {
        const cachedUrlKey = `image_cache_${finalUrl.split('/').pop()?.split('?')[0]}`;
        const cachedUrl = localStorage.getItem(cachedUrlKey);
        
        if (cachedUrl && cachedUrl !== finalUrl && isPermanentStorage(cachedUrl)) {
          console.log("Using permanent cached image URL:", cachedUrl);
          setFinalUrl(cachedUrl);
        }
      } catch (error) {
        console.error("Error checking image cache:", error);
      }
    }
  }, [finalUrl]);
  
  // Pre-load the image to verify if it's valid
  useEffect(() => {
    if (finalUrl && !loaded && !imgError && retryCount < 3) {
      const img = new Image();
      
      // Add cache-busting parameter for temporary URLs
      const urlWithCacheBusting = isTemporaryUrl(finalUrl)
        ? `${finalUrl}&_cb=${Date.now()}`
        : finalUrl;
        
      img.src = urlWithCacheBusting;
      
      const handleLoad = () => {
        setLoaded(true);
        // Cache the successful URL for future reference
        try {
          const urlKey = finalUrl.split('/').pop()?.split('?')[0];
          if (urlKey) {
            localStorage.setItem(`image_cache_${urlKey}`, finalUrl);
          }
        } catch (error) {
          console.error("Error saving to cache:", error);
        }
      };
      
      const handleError = () => {
        console.error(`Failed to pre-load image: ${finalUrl}`);
        
        if (retryCount < 2 && !finalUrl.includes('placeholder')) {
          // Try once more with a small delay
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            
            // Add cache-busting parameter
            const retryUrl = finalUrl.includes('?') 
              ? `${finalUrl}&retry=${Date.now()}` 
              : `${finalUrl}?retry=${Date.now()}`;
              
            setFinalUrl(retryUrl);
          }, 500); // Add a small delay before retry
        } else {
          setImgError(true);
          if (onError) onError();
        }
      };
      
      img.onload = handleLoad;
      img.onerror = handleError;
      
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [finalUrl, onError, loaded, imgError, retryCount]);
  
  // Handle image loading error
  const handleError = () => {
    console.error(`Failed to load image: ${finalUrl}`);
    
    if (retryCount < 2 && !finalUrl.includes('placeholder')) {
      // Try once more
      setRetryCount(prev => prev + 1);
      
      // Add cache-busting parameter
      const retryUrl = finalUrl.includes('?') 
        ? `${finalUrl}&retry=${Date.now()}` 
        : `${finalUrl}?retry=${Date.now()}`;
        
      setFinalUrl(retryUrl);
    } else {
      setImgError(true);
      // Cache the fallback image for future reference
      try {
        const urlKey = imageUrl.split('/').pop()?.split('?')[0];
        if (urlKey) {
          localStorage.setItem(`image_cache_fallback_${urlKey}`, fallbackImage);
        }
      } catch (error) {
        console.error("Error saving fallback to cache:", error);
      }
      if (onError) onError();
    }
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  // Use the fallback image if there was an error
  const displayUrl = imgError ? fallbackImage : finalUrl;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{width: '100%', height: '100%'}}>
      {(!loaded && !imgError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <span className="text-gray-400">Carregando imagem...</span>
        </div>
      )}
      <img
        src={displayUrl}
        alt={alt}
        className={`transition-opacity duration-300 ${!loaded && !imgError ? 'opacity-50' : 'opacity-100'} w-full h-full object-cover`}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{objectFit: 'cover', width: '100%', height: '100%'}}
      />
      {imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
          <img 
            src={fallbackImage} 
            alt={`Fallback for ${alt}`}
            className="w-full h-full object-cover"
            loading="eager"
            onError={() => console.error("Even fallback image failed to load")}
          />
        </div>
      )}
    </div>
  );
};

export default CoverImage;
