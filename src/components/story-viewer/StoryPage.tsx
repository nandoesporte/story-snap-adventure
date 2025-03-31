
import React, { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NarrationPlayer } from "../NarrationPlayer";
import CoverImage from "../CoverImage";
import { getFallbackImage } from "./helpers";

interface StoryPageProps {
  storyId: string | undefined;
  title: string;
  imageUrl: string;
  pageIndex: number;
  pageCount: number;
  childName: string;
  typedText: string;
  isFullscreen: boolean;
  isMobile: boolean;
  hideText: boolean;
  voiceType: 'male' | 'female';
  onImageClick: (url: string) => void;
  onImageError: (url: string) => void;
  onToggleTextVisibility: () => void;
}

export const StoryPage: React.FC<StoryPageProps> = ({
  storyId,
  title,
  imageUrl,
  pageIndex,
  pageCount,
  childName,
  typedText,
  isFullscreen,
  isMobile,
  hideText,
  voiceType,
  onImageClick,
  onImageError,
  onToggleTextVisibility
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fallbackImage = getFallbackImage("");
  const themeFromUrl = imageUrl.includes('theme=') ? 
    imageUrl.split('theme=')[1].split('&')[0] : 
    'fantasy';
  const themeFallback = `/images/placeholders/${themeFromUrl}.jpg`;
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("Failed to load story image:", imageUrl);
    setImageError(true);
    onImageError(imageUrl);
  };
  
  // Mobile layout
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        <div className="story-image-fullscreen h-full w-full relative">
          <CoverImage 
            imageUrl={imageError ? themeFallback : imageUrl}
            fallbackImage={themeFallback}
            alt={`Ilustração da página ${pageIndex + 1}`}
            className="w-full h-full object-cover"
            onClick={() => onImageClick(imageUrl)}
            onError={handleImageError}
            onLoad={handleImageLoad}
            storyId={storyId}
          />
        </div>
        
        {!hideText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end z-10">
            <div className="relative p-6 pb-10 bg-black/30 backdrop-blur-sm rounded-t-2xl">
              <h2 className="text-xl font-bold mb-4 text-white drop-shadow-md">{title}</h2>
              <div className="prose prose-sm text-white">
                {typedText.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-3 leading-relaxed text-white/90 font-medium">{paragraph}</p>
                ))}
                <div className="typing-cursor animate-blink inline-block h-5 w-1 ml-1 bg-white"></div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <NarrationPlayer
                  storyId={storyId || ''}
                  pageIndex={pageIndex}
                  pageText={typedText}
                  voiceType={voiceType}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1"
                  autoPlay={false}
                />
                
                <span className="text-xs text-white/70">
                  Página {pageIndex + 1} de {pageCount}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          className="fixed bottom-28 right-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 flex items-center gap-1 shadow-lg"
          size="sm"
          variant="ghost"
          onClick={onToggleTextVisibility}
        >
          {hideText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {hideText ? "Mostrar texto" : "Ocultar texto"}
        </Button>
      </div>
    );
  }
  
  // Desktop layout
  return (
    <div className="w-full h-full flex">
      <div className="w-3/5 h-full bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-8 relative">
        <div className="w-full h-full max-h-[80vh] max-w-3xl rounded-xl overflow-hidden shadow-lg">
          <CoverImage 
            imageUrl={imageError ? themeFallback : imageUrl}
            fallbackImage={themeFallback}
            alt={`Ilustração da página ${pageIndex + 1}`}
            className="w-full h-full object-contain"
            onClick={() => onImageClick(imageUrl)}
            onError={handleImageError}
            onLoad={handleImageLoad}
            storyId={storyId}
          />
        </div>
      </div>
      
      <div className="w-2/5 h-full overflow-hidden flex flex-col relative border-l border-violet-100">
        {!hideText ? (
          <>
            <ScrollArea className="flex-1 p-8">
              <div className="max-w-xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-violet-900 border-b border-violet-100 pb-4">{title}</h2>
                <div className="prose prose-violet max-w-none">
                  {typedText.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-5 text-lg leading-relaxed text-gray-700">{paragraph}</p>
                  ))}
                  <div className="typing-cursor animate-blink inline-block h-6 w-1 ml-1 bg-violet-400"></div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-violet-100 bg-white flex justify-between items-center">
              <NarrationPlayer
                storyId={storyId || ''}
                pageIndex={pageIndex}
                pageText={typedText}
                voiceType={voiceType}
                autoPlay={false}
              />
              
              <div className="text-sm text-violet-500">
                Página {pageIndex + 1} de {pageCount}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-violet-400 italic">Texto oculto</p>
          </div>
        )}
        
        <Button 
          className="absolute bottom-16 right-6 z-10"
          size="sm"
          variant="outline"
          onClick={onToggleTextVisibility}
        >
          {hideText ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          {hideText ? "Mostrar texto" : "Ocultar texto"}
        </Button>
      </div>
    </div>
  );
};
