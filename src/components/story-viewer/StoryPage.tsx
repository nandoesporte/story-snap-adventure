
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CoverImage from "../CoverImage";
import { fixImageUrl, getImageUrl, isPermanentStorage } from "./helpers";
import { toast } from "sonner";
import { saveImagePermanently } from "@/lib/imageStorage";
import ImageFixButton from "./ImageFixButton";
import { useStoryImages } from "@/hooks/useStoryImages";

interface StoryPageProps {
  pageNumber: number;
  totalPages: number;
  text: string | undefined;
  typedText?: string;
  imageUrl: string;
  theme?: string;
  onImageClick: (url: string) => void;
  onImageError: (url: string) => void;
  isMobile: boolean;
  hideText: boolean;
  storyId?: string;
}

export const StoryPage: React.FC<StoryPageProps> = ({
  pageNumber,
  totalPages,
  text,
  typedText,
  imageUrl,
  theme,
  onImageClick,
  onImageError,
  isMobile,
  hideText,
  storyId
}) => {
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const [showFixButton, setShowFixButton] = useState(false);
  const displayText = typedText || text || "";
  
  // Use the dedicated hook for managing image URLs
  const { 
    processedUrl, 
    isLoading: imageLoading, 
    hasError: imageError, 
    retry: retryImageLoad 
  } = useStoryImages(imageUrl);
  
  useEffect(() => {
    if (imageError) {
      console.log(`Image error detected for page ${pageNumber}, URL: ${imageUrl}`);
      setImageLoadFailed(true);
      setShowFixButton(true);
      onImageError(imageUrl);
    }
  }, [imageError, imageUrl, onImageError, pageNumber]);
  
  // Update visibility of fix button based on image status
  useEffect(() => {
    const needsFixButton = imageError || imageLoadFailed || !imageUrl || imageUrl.includes('/images/defaults/');
    setShowFixButton(needsFixButton);
  }, [imageError, imageLoadFailed, imageUrl]);
  
  const paragraphs = displayText ? displayText.split("\n").filter(p => p.trim().length > 0) : [];
  
  const handleImageClick = () => {
    if (!imageLoadFailed) {
      onImageClick(processedUrl || imageUrl);
    }
  };
  
  const handleImageError = () => {
    console.error("Failed to load image in StoryPage:", processedUrl, "Original URL:", imageUrl);
    setImageLoadFailed(true);
    setShowFixButton(true);
    onImageError(processedUrl || imageUrl);
    
    // Try to reload with new URL
    if (!isPermanentStorage(processedUrl) && loadRetry < 2) {
      console.log(`Attempting to reload image for page ${pageNumber} (retry ${loadRetry + 1})`);
      retryImageLoad();
      setLoadRetry(prev => prev + 1);
    }
  };

  const handleImageFixed = (fixedUrls: Record<string, string>) => {
    if (fixedUrls[imageUrl]) {
      retryImageLoad();
      setImageLoadFailed(false);
      setShowFixButton(false);
      console.log(`Image for page ${pageNumber} fixed with new URL:`, fixedUrls[imageUrl]);
    }
  };

  const handleDoubleTap = () => {
    if (isMobile) {
      setIsFullscreenMode(!isFullscreenMode);
      
      try {
        if (!isFullscreenMode) {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          }
        } else {
          if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
          }
        }
      } catch (error) {
        console.error("Fullscreen API error:", error);
      }
    }
  };

  // Extra safety measure - if all else fails, use the theme default image
  const fallbackImage = `/images/defaults/${theme || 'default'}.jpg`;
  
  // Add debugging display for development
  const debugInfo = process.env.NODE_ENV === 'development' && (
    <div className="absolute top-1 right-1 bg-black/50 text-white p-1 text-xs rounded z-50 max-w-[200px] truncate">
      Page: {pageNumber}, Status: {imageLoading ? 'Loading' : (imageError ? 'Error' : 'OK')}
    </div>
  );

  return isMobile ? (
    <div 
      className={`w-full h-full flex flex-col relative ${isFullscreenMode ? 'fixed inset-0 z-50 bg-black' : ''}`}
      onDoubleClick={handleDoubleTap}
    >
      <div className="absolute inset-0 z-0">
        {debugInfo}
        <CoverImage 
          imageUrl={processedUrl}
          fallbackImage={fallbackImage}
          alt={`Ilustração da página ${pageNumber} de ${totalPages}`}
          className={`w-full h-full ${isFullscreenMode ? 'object-contain' : 'object-cover'}`}
          onClick={handleImageClick}
          onError={handleImageError}
        />
      </div>
      
      {showFixButton && storyId && (
        <div className="absolute top-2 left-2 z-20">
          <ImageFixButton 
            storyId={storyId}
            imageUrls={[imageUrl]}
            onImagesFixed={handleImageFixed}
            variant="storySecondary"
            size="sm"
          />
        </div>
      )}
      
      {!hideText && paragraphs.length > 0 && (
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end pt-8 z-10 ${isFullscreenMode ? 'pb-20' : ''}`}>
          <div className="p-5 pb-12 md:pb-16">
            <div className="prose prose-sm prose-invert max-w-none">
              {paragraphs.map((paragraph, index) => (
                <p 
                  key={index} 
                  className="mb-3 text-white/90 text-sm md:text-base lg:text-lg text-shadow leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {isFullscreenMode && (
        <div className="absolute bottom-4 right-4 z-50">
          <button 
            className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
            onClick={() => setIsFullscreenMode(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
              <path d="M21 8h-3a2 2 0 0 1-2-2V3"></path>
              <path d="M3 16h3a2 2 0 0 1 2 2v3"></path>
              <path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="w-full h-full flex md:flex-row">
      <div className="w-1/2 h-full flex items-center justify-center p-4 bg-gray-50 relative">
        {debugInfo}
        <motion.div 
          className="relative w-full h-full flex items-center justify-center"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <CoverImage 
            imageUrl={processedUrl}
            fallbackImage={fallbackImage}
            alt={`Ilustração da página ${pageNumber} de ${totalPages}`}
            className="max-w-full max-h-full object-contain rounded-md shadow-lg"
            onClick={handleImageClick}
            onError={handleImageError}
          />
          
          {showFixButton && storyId && (
            <div className="absolute top-2 left-2">
              <ImageFixButton 
                storyId={storyId}
                imageUrls={[imageUrl]}
                onImagesFixed={handleImageFixed}
                variant="outline"
                size="sm"
              />
            </div>
          )}
        </motion.div>
      </div>
      
      <div className="w-1/2 h-full flex flex-col p-8 overflow-auto">
        {paragraphs.length > 0 ? (
          <div className="prose max-w-none text-lg space-y-4 leading-relaxed">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-400 italic">Texto não disponível para esta página</p>
          </div>
        )}
      </div>
    </div>
  );
};
