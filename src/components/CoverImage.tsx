
import React from 'react';
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
  
  // Use processed URL or fallback if there was an error
  const displayUrl = hasError ? fallbackImage : processedUrl;
  
  return (
    <img
      src={displayUrl}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'} ${className}`}
      onClick={onClick}
      onError={onError}
    />
  );
};

export default CoverImage;
