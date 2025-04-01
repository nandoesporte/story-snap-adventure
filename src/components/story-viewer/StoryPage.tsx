
import React from "react";
import { motion } from "framer-motion";
import CoverImage from "../CoverImage";
import { fixImageUrl, getImageUrl } from "./helpers";

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
  const displayText = typedText || text || "";
  const processedImageUrl = fixImageUrl(getImageUrl(imageUrl, theme));
  
  // Split text into paragraphs
  const paragraphs = displayText ? displayText.split("\n").filter(p => p.trim().length > 0) : [];
  
  const handleImageClick = () => {
    onImageClick(processedImageUrl);
  };
  
  const handleImageError = () => {
    console.error("Failed to load image in StoryPage:", imageUrl);
    onImageError(imageUrl);
  };

  // Different layout for mobile vs desktop
  return isMobile ? (
    <div className="w-full h-full flex flex-col relative">
      <div className="absolute inset-0 z-0">
        <CoverImage 
          imageUrl={processedImageUrl}
          fallbackImage={`/images/defaults/${theme || 'default'}.jpg`}
          alt={`Ilustração da página ${pageNumber} de ${totalPages}`}
          className="w-full h-full"
          onClick={handleImageClick}
        />
      </div>
      
      {!hideText && paragraphs.length > 0 && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end pt-8 z-10">
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
            fallbackImage={`/images/defaults/${theme || 'default'}.jpg`}
            alt={`Ilustração da página ${pageNumber} de ${totalPages}`}
            className="max-w-full max-h-full object-contain rounded-md shadow-lg"
            onClick={handleImageClick}
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
