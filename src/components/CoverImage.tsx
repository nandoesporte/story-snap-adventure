
import React, { useState } from 'react';
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
  
  // Use processed URL or fallback if there was an error
  const displayUrl = hasError || imgError ? fallbackImage : processedUrl;
  
  // Handle image loading error
  const handleError = () => {
    console.error(`Failed to load image: ${processedUrl}`);
    setImgError(true);
    if (onError) onError();
  };

  return (
    <img
      src={displayUrl}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'} ${className}`}
      onClick={onClick}
      onError={handleError}
      loading="eager" // Força o carregamento imediato da imagem
    />
  );
};

export default CoverImage;
