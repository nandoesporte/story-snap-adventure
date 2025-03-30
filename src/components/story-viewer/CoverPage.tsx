
import React from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  onImageError,
}) => {
  if (isMobile) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="w-full h-full">
          <img 
            src={coverImageSrc}
            alt={title}
            className="w-full h-full object-cover"
            onClick={() => onImageClick(coverImageSrc)}
            onError={() => onImageError(coverImageSrc)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">{title}</h1>
            <p className="text-xl text-white/90 mt-2 drop-shadow-md">Uma história para {childName}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {theme && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                  {theme}
                </span>
              )}
              {setting && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                  {setting}
                </span>
              )}
              {style && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                  {style}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-violet-50 to-indigo-50 flex flex-col">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="w-4/5 max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
            <AspectRatio ratio={4/3} className="bg-muted">
              <img 
                src={coverImageSrc} 
                alt={title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onImageClick(coverImageSrc)}
                onError={() => onImageError(coverImageSrc)}
              />
            </AspectRatio>
          </div>
        </div>
        <div className="p-8 bg-white border-t border-gray-100 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">{title}</h1>
          <p className="text-lg text-gray-600 mb-4">Uma história para {childName}</p>
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
