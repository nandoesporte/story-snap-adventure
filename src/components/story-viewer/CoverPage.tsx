
import React from "react";
import CoverImage from "../CoverImage";

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
  const getFallbackImage = (theme: string = ""): string => {
    const themeImages: {[key: string]: string} = {
      adventure: "/images/covers/adventure.jpg",
      fantasy: "/images/covers/fantasy.jpg",
      space: "/images/covers/space.jpg",
      ocean: "/images/covers/ocean.jpg",
      dinosaurs: "/images/covers/dinosaurs.jpg",
      forest: "/images/placeholders/adventure.jpg"
    };
    
    const themeLower = theme.toLowerCase();
    for (const [key, url] of Object.entries(themeImages)) {
      if (themeLower.includes(key)) {
        return url;
      }
    }
    
    return "/placeholder.svg";
  };

  const fallbackImage = getFallbackImage(theme);

  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50">
            <CoverImage 
              imageUrl={coverImageSrc}
              fallbackImage={fallbackImage}
              alt={title}
              className="w-full h-full"
              onClick={() => onImageClick(coverImageSrc)}
              onError={() => onImageError(coverImageSrc)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-md">{title}</h2>
              <p className="text-xl text-white/90 mb-3 drop-shadow-md">Uma história para {childName}</p>
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
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="w-4/5 h-4/5 max-h-[70vh] relative rounded-xl shadow-md overflow-hidden">
            <CoverImage 
              imageUrl={coverImageSrc}
              fallbackImage={fallbackImage}
              alt={title}
              className="w-full h-full object-cover"
              onClick={() => onImageClick(coverImageSrc)}
              onError={() => onImageError(coverImageSrc)}
            />
          </div>
        </div>
        <div className="p-6 bg-white border-t border-gray-100 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">{title}</h2>
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
