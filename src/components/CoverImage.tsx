
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import LoadingSpinner from './LoadingSpinner';

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
  fallbackImage = '/images/defaults/default.jpg',
  alt,
  className = '',
  onClick,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [src, setSrc] = useState(imageUrl);
  const maxRetries = 2;

  useEffect(() => {
    // Reset states when imageUrl changes
    setLoading(true);
    setError(false);
    setRetryCount(0);
    setSrc(imageUrl);
  }, [imageUrl]);

  // Preload image
  useEffect(() => {
    // Skip this effect if the source is already the fallback
    if (src === fallbackImage && retryCount > 0) {
      setLoading(false);
      return;
    }
    
    const img = new Image();
    let isMounted = true;
    
    img.onload = () => {
      if (isMounted) {
        setLoading(false);
        setError(false);
      }
    };
    
    img.onerror = () => {
      if (!isMounted) return;
      
      console.error("Failed to pre-load image:", src);
      
      if (retryCount < maxRetries) {
        // Add cache-busting parameter
        const newSrc = `${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`;
        setSrc(newSrc);
        setRetryCount(prev => prev + 1);
      } else if (src !== fallbackImage) {
        console.error("Falling back to default image after", maxRetries, "failed attempts");
        setSrc(fallbackImage);
        setLoading(false);
        setError(true);
        
        // Call onError callback if provided
        if (onError) {
          onError(src);
        }
      } else {
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
          const newSrc = `${src}${src.includes('?') ? '&' : '?'}timeout=${Date.now()}`;
          setSrc(newSrc);
          setRetryCount(prev => prev + 1);
        } else if (src !== fallbackImage) {
          setSrc(fallbackImage);
          setLoading(false);
          setError(true);
          if (onError) {
            onError(src);
          }
        } else {
          setLoading(false);
          setError(true);
        }
      }
    }, 10000); // 10 seconds timeout
    
    img.src = src;
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackImage, retryCount, maxRetries, onError, loading]);

  const handleError = () => {
    console.error("Failed to load image:", src);
    
    if (retryCount < maxRetries) {
      // Add cache-busting parameter
      const newSrc = `${src}${src.includes('?') ? '&' : '?'}retry=${Date.now()}`;
      setSrc(newSrc);
      setRetryCount(prev => prev + 1);
    } else if (src !== fallbackImage) {
      setSrc(fallbackImage);
      setError(true);
      
      // Call onError callback if provided
      if (onError) {
        onError(src);
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
      
      <img
        src={src}
        alt={alt}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

export default CoverImage;
