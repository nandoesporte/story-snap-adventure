
import React, { useState, useEffect } from 'react';
import { useStoryImages } from '@/hooks/useStoryImages';

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
  const { processedUrl, hasError, isLoading } = useStoryImages(imageUrl);
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use processed URL or fallback if there was an error
  const displayUrl = hasError || imgError ? fallbackImage : processedUrl;
  
  // Reset the error and loaded state when the image URL changes
  useEffect(() => {
    setImgError(false);
    setLoaded(false);
    setRetryCount(0);
  }, [imageUrl]);
  
  // Pre-load the image to verify if it's valid
  useEffect(() => {
    if (displayUrl && !loaded && !imgError && retryCount < 2) {
      const img = new Image();
      img.src = displayUrl;
      
      const handleLoad = () => {
        setLoaded(true);
        console.log("Image pre-loaded successfully:", displayUrl);
      };
      
      const handleError = () => {
        console.error(`Failed to pre-load image: ${displayUrl}`);
        
        if (retryCount < 1 && !displayUrl.includes('placeholder')) {
          // Try once more with a small delay
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            img.src = displayUrl + '?retry=' + Date.now();
          }, 1000);
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
  }, [displayUrl, onError, loaded, imgError, retryCount]);
  
  // Handle image loading error
  const handleError = () => {
    console.error(`Failed to load image: ${processedUrl}`);
    
    if (retryCount < 1 && !processedUrl.includes('placeholder')) {
      // Try once more
      setRetryCount(prev => prev + 1);
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
    console.log("Image loaded successfully:", displayUrl);
  };

  return (
    <div className={`relative overflow-hidden ${className}`} style={{width: '100%', height: '100%'}}>
      {(!loaded && !imgError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <span className="text-gray-400">Carregando imagem...</span>
        </div>
      )}
      <img
        src={`${displayUrl}${retryCount > 0 ? `?retry=${Date.now()}` : ''}`}
        alt={alt}
        className={`transition-opacity duration-300 ${(isLoading || !loaded) && !imgError ? 'opacity-50' : 'opacity-100'} w-full h-full object-cover`}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        style={{objectFit: 'cover', width: '100%', height: '100%'}}
      />
      {imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <img 
            src={fallbackImage} 
            alt={`Fallback for ${alt}`}
            className="w-full h-full object-cover"
            onError={() => console.error("Even fallback image failed to load")}
          />
        </div>
      )}
    </div>
  );
};

export default CoverImage;
