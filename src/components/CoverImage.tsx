
import React, { useState, useEffect } from 'react';
import { isPermanentStorage, isTemporaryUrl, saveImageToPermanentStorage } from './story-viewer/helpers';
import { toast } from "sonner";

interface CoverImageProps {
  imageUrl: string;
  fallbackImage: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
  onLoad?: () => void;
  storyId?: string;
}

export const CoverImage: React.FC<CoverImageProps> = ({
  imageUrl,
  fallbackImage,
  alt,
  className = '',
  onClick,
  onError,
  onLoad,
  storyId
}) => {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [finalUrl, setFinalUrl] = useState<string>(imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  // Reset state when image URL changes
  useEffect(() => {
    setImgError(false);
    setLoaded(false);
    setRetryCount(0);
    setFinalUrl(imageUrl);
    setIsSaving(false);
    setSaveError(false);
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
  
  // Save temporary URLs to permanent storage after loading
  useEffect(() => {
    if (loaded && !imgError && isTemporaryUrl(finalUrl) && !isPermanentStorage(finalUrl) && !isSaving) {
      const saveImage = async () => {
        try {
          setIsSaving(true);
          setSaveError(false);
          console.log("Saving temporary image to permanent storage:", finalUrl);
          
          const permanentUrl = await saveImageToPermanentStorage(finalUrl, storyId);
          
          if (permanentUrl !== finalUrl) {
            console.log("Image saved to permanent storage:", permanentUrl);
            setFinalUrl(permanentUrl);
          } else {
            console.warn("Image storage returned same URL, may have failed");
            setSaveError(true);
          }
        } catch (error) {
          console.error("Failed to save image to permanent storage:", error);
          setSaveError(true);
          // Don't show toast here, it's handled in saveImageToPermanentStorage
        } finally {
          setIsSaving(false);
        }
      };
      
      saveImage();
    }
  }, [loaded, finalUrl, imgError, isSaving, storyId]);
  
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
    if (onLoad) onLoad();
  };

  // Retry save manually if needed
  const handleRetrySave = () => {
    if (isTemporaryUrl(finalUrl) && !isPermanentStorage(finalUrl)) {
      setSaveError(false);
      setIsSaving(false); // Force re-trigger the save effect
    }
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
      {isSaving && (
        <div className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded-md shadow flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="font-medium">Salvando...</span>
        </div>
      )}
      {saveError && !isSaving && (
        <div 
          className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded-md shadow cursor-pointer hover:bg-red-50"
          onClick={handleRetrySave}
        >
          <span className="text-red-500 font-medium">Erro ao salvar. Clique para tentar novamente.</span>
        </div>
      )}
    </div>
  );
};

export default CoverImage;
