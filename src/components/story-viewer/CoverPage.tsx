
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
        <div className="w-full h-full relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-white drop-shadow-md line-clamp-2 font-serif">{title}</h2>
              <p className="text-lg md:text-xl text-white/90 mb-3 drop-shadow-md">Uma história para {childName}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {theme && (
                  <span className="px-3 py-1 bg-amber-400/80 text-black rounded-full text-sm font-medium">
                    {theme}
                  </span>
                )}
                {setting && (
                  <span className="px-3 py-1 bg-amber-400/80 text-black rounded-full text-sm font-medium">
                    {setting}
                  </span>
                )}
                {style && (
                  <span className="px-3 py-1 bg-amber-400/80 text-black rounded-full text-sm font-medium">
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
    <div className="w-full h-full flex" data-testid="cover-page-desktop">
      <div className="w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxkZWZzPgogICAgPHBhdHRlcm4gaWQ9InNwYXJrbGVzIiB4PSIwIiB5PSIwIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8Y2lyY2xlIGN4PSI1IiBjeT0iNSIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDE4MSwgNDUsIDAuMikiIC8+CiAgICAgIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjIiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsIDE4MSwgNDUsIDAuMikiIC8+CiAgICAgIDxjaXJjbGUgY3g9IjQwIiBjeT0iMTAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAxODEsIDQ1LCAwLjIpIiAvPgogICAgICA8Y2lyY2xlIGN4PSIzMCIgY3k9IjQwIiByPSIxLjUiIGZpbGw9InJnYmEoMjU1LCAxODEsIDQ1LCAwLjIpIiAvPgogICAgICA8Y2lyY2xlIGN4PSI4IiBjeT0iMzkiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAxODEsIDQ1LCAwLjIpIiAvPgogICAgPC9wYXR0ZXJuPgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3NwYXJrbGVzKSIgLz4KPC9zdmc+')]"></div>
        
        <div className="w-[85%] h-[75%] flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-200/50 z-10">
          <div className="flex-1 flex">
            <div className="w-1/2 h-full relative">
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
            
            <div className="w-1/2 flex flex-col p-8 justify-center">
              <h2 className="text-3xl font-bold mb-6 text-amber-800 font-serif">{title}</h2>
              <p className="text-xl text-amber-700 mb-8">Uma história para {childName}</p>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {theme && (
                  <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    {theme}
                  </span>
                )}
                {setting && (
                  <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    {setting}
                  </span>
                )}
                {style && (
                  <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    {style}
                  </span>
                )}
              </div>
              
              <div className="text-amber-600 text-sm italic">
                Toque na tela ou use as setas para iniciar a leitura
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
