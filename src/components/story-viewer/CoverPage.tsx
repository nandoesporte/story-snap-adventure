
import React, { useEffect, useState } from "react";
import CoverImage from "../CoverImage";
import { getImageUrl } from "./helpers";

interface CoverPageProps {
  title: string;
  coverImageSrc: string;
  childName: string;
  theme: string;
  setting: string;
  style?: string;
  isMobile: boolean;
  storyId?: string;
  onImageClick: (url: string) => void;
  onImageError: (url: string) => void;
}

export const CoverPage: React.FC<CoverPageProps> = ({
  title,
  coverImageSrc,
  childName,
  theme,
  setting,
  style,
  isMobile,
  storyId,
  onImageClick,
  onImageError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const formattedImageUrl = getImageUrl(coverImageSrc, theme);
  const fallbackImageUrl = `/images/placeholders/${theme || 'fantasy'}.jpg`;

  // Log for debugging
  useEffect(() => {
    console.log("CoverPage rendering with:", {
      title,
      imageUrl: formattedImageUrl,
      isMobile,
      theme,
      imageLoaded,
      imageError,
      storyId
    });
  }, [formattedImageUrl, isMobile, title, theme, imageLoaded, imageError, storyId]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("Failed to load cover image:", formattedImageUrl);
    setImageError(true);
    onImageError(coverImageSrc);
  };

  // Mobile layout
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col" data-testid="cover-page-mobile">
        <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50">
            <CoverImage 
              imageUrl={imageError ? fallbackImageUrl : formattedImageUrl}
              fallbackImage={fallbackImageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onClick={() => onImageClick(formattedImageUrl)}
              onError={handleImageError}
              onLoad={handleImageLoad}
              storyId={storyId}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 flex flex-col justify-end p-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md line-clamp-2">{title}</h2>
              <p className="text-lg md:text-xl text-white/90 mb-4 drop-shadow-md">Uma história para {childName}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {theme && (
                  <span className="px-3 py-1 bg-white/40 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                    {theme}
                  </span>
                )}
                {setting && (
                  <span className="px-3 py-1 bg-white/40 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                    {setting}
                  </span>
                )}
                {style && (
                  <span className="px-3 py-1 bg-white/40 backdrop-blur-sm text-white rounded-full text-sm font-medium">
                    {style}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop layout
  return (
    <div className="w-full h-full flex flex-col" data-testid="cover-page-desktop">
      <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="absolute inset-0 flex items-center justify-center p-10">
          <div className="w-full max-w-2xl aspect-[3/4] rounded-2xl shadow-xl overflow-hidden relative">
            <CoverImage 
              imageUrl={imageError ? fallbackImageUrl : formattedImageUrl}
              fallbackImage={fallbackImageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onClick={() => onImageClick(formattedImageUrl)}
              onError={handleImageError}
              onLoad={handleImageLoad}
              storyId={storyId}
            />
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-md border-t border-violet-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-violet-900">{title}</h2>
            <p className="text-lg text-violet-700 mb-3">Uma história para {childName}</p>
            <div className="flex flex-wrap gap-2">
              {theme && (
                <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm font-medium">
                  {theme}
                </span>
              )}
              {setting && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {setting}
                </span>
              )}
              {style && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {style}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
