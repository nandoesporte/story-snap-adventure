
import React, { useState } from "react";
import { motion } from "framer-motion";
import CoverImage from "../CoverImage";
import { fixImageUrl, getImageUrl } from "./helpers";
import { toast } from "sonner";

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
  hideText
}) => {
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const displayText = typedText || text || "";
  
  // Process image URL with better error handling
  let processedImageUrl = "";
  try {
    processedImageUrl = fixImageUrl(getImageUrl(imageUrl, theme));
    console.log(`Page ${pageNumber} using image URL:`, processedImageUrl);
  } catch (error) {
    console.error("Error processing image URL:", error);
    processedImageUrl = `/images/defaults/${theme || 'default'}.jpg`;
  }
  
  // Fallback image logic
  const fallbackImage = `/images/defaults/${theme || 'default'}.jpg`;
  
  // Split text into paragraphs
  const paragraphs = displayText ? displayText.split("\n").filter(p => p.trim().length > 0) : [];
  
  const handleImageClick = () => {
    if (!imageLoadFailed) {
      onImageClick(processedImageUrl);
    }
  };
  
  const handleImageError = () => {
    console.error("Failed to load image in StoryPage:", processedImageUrl, "Original URL:", imageUrl);
    setImageLoadFailed(true);
    onImageError(processedImageUrl);
    
    // Try again with a default image
    setImageLoadFailed(true);
  };

  // Handle double tap/click for mobile fullscreen
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

  // Different layout for mobile vs desktop
  return isMobile ? (
    <div 
      className={`w-full h-full flex flex-col relative ${isFullscreenMode ? 'fixed inset-0 z-50 bg-black' : ''}`}
      onDoubleClick={handleDoubleTap}
    >
      <div className="absolute inset-0 z-0">
        <CoverImage 
          imageUrl={processedImageUrl}
          fallbackImage={fallbackImage}
          alt={`Ilustração da página ${pageNumber} de ${totalPages}`}
          className={`w-full h-full ${isFullscreenMode ? 'object-contain' : 'object-cover'}`}
          onClick={handleImageClick}
          onError={handleImageError}
        />
      </div>
      
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
      <div className="w-1/2 h-full flex items-center justify-center p-4 bg-gray-50">
        <motion.div 
          className="relative w-full h-full flex items-center justify-center"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <CoverImage 
            imageUrl={processedImageUrl}
            fallbackImage={fallbackImage}
            alt={`Ilustração da página ${pageNumber} de ${totalPages}`}
            className="max-w-full max-h-full object-contain rounded-md shadow-lg"
            onClick={handleImageClick}
            onError={handleImageError}
          />
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
