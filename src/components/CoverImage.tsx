
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
    const img = new Image();
    
    img.onload = () => {
      setLoading(false);
      setError(false);
    };
    
    img.onerror = () => {
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
    
    img.src = src;
  }, [src, fallbackImage, retryCount, maxRetries, onError]);

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
