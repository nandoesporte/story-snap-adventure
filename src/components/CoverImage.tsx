
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';
import { getDefaultImageForTheme } from '@/lib/defaultImages';

interface CoverImageProps {
  imageUrl: string;
  fallbackImage?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: (url: string) => void;
}

const CoverImage: React.FC<CoverImageProps> = ({
  imageUrl,
  fallbackImage = getDefaultImageForTheme('default'),
  alt,
  className = '',
  onClick,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const maxRetries = 2;

  useEffect(() => {
    // Reset states when imageUrl changes
    setLoading(true);
    setError(false);
    setRetryCount(0);
    
    // Process the URL
    if (!imageUrl || imageUrl === '') {
      console.log("No image URL provided, using fallback:", fallbackImage);
      setSrc(fallbackImage);
    } else {
      console.log("Setting image source to:", imageUrl);
      setSrc(imageUrl);
    }
  }, [imageUrl, fallbackImage]);

  // Preload image
  useEffect(() => {
    if (!src) return;
    
    // Skip this effect if the source is already the fallback and we've retried
    if (src === fallbackImage && retryCount > 0) {
      setLoading(false);
      return;
    }
    
    const img = new Image();
    let isMounted = true;
    
    img.onload = () => {
      if (isMounted) {
        console.log("Image loaded successfully:", src);
        setLoading(false);
        setError(false);
      }
    };
    
    img.onerror = () => {
      if (!isMounted) return;
      
      console.error(`Failed to pre-load image: ${src}`);
      
      if (retryCount < maxRetries) {
        // Add cache-busting parameter
        try {
          const newSrc = src.includes('?') 
            ? `${src}&retry=${Date.now()}` 
            : `${src}?retry=${Date.now()}`;
          
          console.log(`Retrying image load (${retryCount + 1}/${maxRetries}):`, newSrc);
          setSrc(newSrc);
          setRetryCount(prev => prev + 1);
        } catch (error) {
          console.error("Error creating retry URL:", error);
          useDefaultImage();
        }
      } else {
        useDefaultImage();
      }
    };
    
    const useDefaultImage = () => {
      if (src !== fallbackImage) {
        console.log("Using fallback image after failed attempts:", fallbackImage);
        setSrc(fallbackImage);
        setLoading(false);
        setError(true);
        
        // Call onError callback if provided
        if (onError) {
          onError(src);
        }
      } else {
        console.error("Even fallback image failed to load");
        setLoading(false);
        setError(true);
      }
    };
    
    // Set a timeout to handle cases where the image load hangs
    const timeoutId = setTimeout(() => {
      if (loading && isMounted) {
        console.warn("Image load timeout for:", src);
        img.src = ""; // Cancel the current load
        
        if (retryCount < maxRetries) {
          try {
            const newSrc = src.includes('?') 
              ? `${src}&timeout=${Date.now()}` 
              : `${src}?timeout=${Date.now()}`;
            
            console.log(`Retrying image load after timeout (${retryCount + 1}/${maxRetries}):`, newSrc);
            setSrc(newSrc);
            setRetryCount(prev => prev + 1);
          } catch (error) {
            console.error("Error creating timeout retry URL:", error);
            useDefaultImage();
          }
        } else {
          useDefaultImage();
        }
      }
    }, 10000); // 10 seconds timeout
    
    console.log("Loading image:", src);
    img.src = src;
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackImage, retryCount, maxRetries, onError, loading]);

  const handleError = () => {
    console.error("Failed to load image in img element:", src);
    
    if (retryCount < maxRetries) {
      // Add cache-busting parameter
      try {
        const newSrc = src?.includes('?') 
          ? `${src}&retry=${Date.now()}` 
          : `${src}?retry=${Date.now()}`;
        
        console.log(`Retrying image load from error handler (${retryCount + 1}/${maxRetries}):`, newSrc);
        setSrc(newSrc);
        setRetryCount(prev => prev + 1);
      } catch (error) {
        console.error("Error creating error handler retry URL:", error);
        
        if (src !== fallbackImage) {
          setSrc(fallbackImage);
          setError(true);
          
          // Call onError callback if provided
          if (onError) {
            onError(src || '');
          }
        }
      }
    } else if (src !== fallbackImage) {
      console.log("Using fallback image after error handler retries:", fallbackImage);
      setSrc(fallbackImage);
      setError(true);
      
      // Call onError callback if provided
      if (onError) {
        onError(src || '');
      }
    }
  };

  const containerClasses = `relative overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`;

  return (
    <div className={containerClasses} onClick={onClick}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <LoadingSpinner size="md" />
        </div>
      )}
      
      {src && (
        <img
          src={src}
          alt={alt}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
    </div>
  );
};

export default CoverImage;
