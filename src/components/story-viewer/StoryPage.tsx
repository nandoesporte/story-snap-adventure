
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
  
  // Debug logging
  useEffect(() => {
    console.log("StoryPage rendering:", {
      title,
      imageUrl,
      pageIndex,
      isMobile,
      isFullscreen,
      hideText,
      hasText: !!typedText,
      imageLoaded,
      imageError,
      storyId
    });
  }, [title, imageUrl, pageIndex, isMobile, isFullscreen, hideText, typedText, imageLoaded, imageError, storyId]);

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
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end z-10">
            <div className="relative p-5 pb-8 bg-black/50 backdrop-blur-md rounded-t-2xl">
              <div className="prose prose-sm story-text text-white">
                {typedText.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2 leading-relaxed text-shadow font-medium text-balance">{paragraph}</p>
                ))}
                <div className="typing-cursor animate-blink inline-block h-5 w-1 ml-1 bg-white"></div>
              </div>
              
              <div className="pt-3 mt-3 border-t border-white/30 text-xs text-white/80 flex justify-between">
                {!isFullscreen && (
                  <span>{childName}</span>
                )}
              </div>
              
              <div className="mt-4 flex justify-center gap-2">
                <NarrationPlayer
                  storyId={storyId || ''}
                  pageIndex={pageIndex}
                  pageText={typedText}
                  voiceType={voiceType}
                  className="bg-amber-400/80 hover:bg-amber-500/90 text-black rounded-full p-1"
                  autoPlay={!isMobile}
                />
              </div>
            </div>
          </div>
        )}
        
        <Button 
          className="fixed bottom-24 right-4 z-50 rounded-full bg-amber-400/90 hover:bg-amber-500 text-black text-sm py-1 px-3 flex items-center gap-1 shadow-lg"
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
    <div className="w-full h-full flex flex-row bg-amber-50/50">
      <div className="w-1/2 h-full bg-amber-50/30 border-r border-amber-200/40 flex items-center justify-center p-6 overflow-hidden">
        <div className="relative w-full h-full max-w-md max-h-[80vh] mx-auto">
          <CoverImage 
            imageUrl={imageError ? themeFallback : imageUrl}
            fallbackImage={themeFallback}
            alt={`Ilustração da página ${pageIndex + 1}`}
            className="w-full h-full object-contain rounded-lg shadow-md"
            onClick={() => onImageClick(imageUrl)}
            onError={handleImageError}
            onLoad={handleImageLoad}
            storyId={storyId}
          />
        </div>
      </div>
      
      <div className="w-1/2 h-full bg-white/80 overflow-hidden flex flex-col relative">
        {!hideText ? (
          <>
            <ScrollArea className="h-full px-6 py-8 bg-white/50">
              <div className="mb-6 bg-white/80 p-6 rounded-xl backdrop-blur-sm shadow-sm border border-amber-100">
                <div className="prose prose-lg">
                  {typedText.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-lg leading-relaxed font-medium text-gray-700">{paragraph}</p>
                  ))}
                  <div className="typing-cursor animate-blink inline-block h-6 w-1 ml-1 bg-amber-600"></div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 pt-3 border-t border-amber-100 text-sm text-gray-500 flex justify-center items-center bg-white/90 backdrop-blur-sm">
              <NarrationPlayer
                storyId={storyId || ''}
                pageIndex={pageIndex}
                pageText={typedText}
                voiceType={voiceType}
                autoPlay={false}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-amber-700/50 italic">Texto oculto</p>
          </div>
        )}
        
        <Button 
          className="absolute bottom-4 right-4 z-10 bg-amber-400/90 hover:bg-amber-500 text-black"
          size="sm"
          variant="secondary"
          onClick={onToggleTextVisibility}
        >
          {hideText ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          {hideText ? "Mostrar texto" : "Ocultar texto"}
        </Button>
      </div>
    </div>
  );
};
