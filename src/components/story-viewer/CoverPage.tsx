
import React, { useEffect } from "react";
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
  onImageClick,
  onImageError
}) => {
  const formattedImageUrl = getImageUrl(coverImageSrc, theme);

  // Log for debugging
  useEffect(() => {
    console.log("CoverPage rendering with:", {
      title,
      imageUrl: formattedImageUrl,
      isMobile,
      theme
    });
  }, [formattedImageUrl, isMobile, title, theme]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col" data-testid="cover-page-mobile">
        <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50">
            <CoverImage 
              imageUrl={formattedImageUrl}
              fallbackImage={getImageUrl(undefined, theme)}
              alt={title}
              className="w-full h-full object-cover"
              onClick={() => onImageClick(formattedImageUrl)}
              onError={(url) => onImageError(url)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 md:p-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-white drop-shadow-md line-clamp-2">{title}</h2>
              <p className="text-lg md:text-xl text-white/90 mb-2 md:mb-3 drop-shadow-md">Uma história para {childName}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {theme && (
                  <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm">
                    {theme}
                  </span>
                )}
                {setting && (
                  <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm">
                    {setting}
                  </span>
                )}
                {style && (
                  <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm">
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
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
          <div className="w-4/5 h-4/5 max-h-[70vh] relative rounded-xl shadow-md overflow-hidden">
            <CoverImage 
              imageUrl={formattedImageUrl}
              fallbackImage={getImageUrl(undefined, theme)}
              alt={title}
              className="w-full h-full object-cover"
              onClick={() => onImageClick(formattedImageUrl)}
              onError={(url) => onImageError(url)}
            />
          </div>
        </div>
        <div className="p-6 bg-white border-t border-gray-100 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 text-gray-800 line-clamp-2">{title}</h2>
          <p className="text-lg text-gray-600 mb-3">Uma história para {childName}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {theme && (
              <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm">
                {theme}
              </span>
            )}
            {setting && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {setting}
              </span>
            )}
            {style && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {style}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
