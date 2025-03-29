
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
  
  // Use processed URL or fallback if there was an error
  const displayUrl = hasError || imgError ? fallbackImage : processedUrl;
  
  // Pre-load the image to verify if it's valid
  useEffect(() => {
    if (displayUrl) {
      const img = new Image();
      img.src = displayUrl;
      img.onload = () => setLoaded(true);
      img.onerror = () => {
        console.error(`Failed to pre-load image: ${displayUrl}`);
        setImgError(true);
        if (onError) onError();
      };
    }
  }, [displayUrl, onError]);
  
  // Handle image loading error
  const handleError = () => {
    console.error(`Failed to load image: ${processedUrl}`);
    setImgError(true);
    // Cache the fallback image for future reference
    try {
      localStorage.setItem(`image_cache_fallback_${imageUrl.split('/').pop()}`, fallbackImage);
    } catch (error) {
      console.error("Error saving fallback to cache:", error);
    }
    if (onError) onError();
  };

  const handleLoad = () => {
    setLoaded(true);
  };

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
        className={`transition-opacity duration-300 ${isLoading || !loaded ? 'opacity-50' : 'opacity-100'} w-full h-full object-cover`}
        onClick={onClick}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        style={{objectFit: 'cover', width: '100%', height: '100%'}}
      />
    </div>
  );
};

export default CoverImage;
