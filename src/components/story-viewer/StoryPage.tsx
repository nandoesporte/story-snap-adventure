
import React, { useEffect } from "react";
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
  const fallbackImage = getFallbackImage("");
  
  // Log de depuração
  useEffect(() => {
    console.log("StoryPage renderizada:", {
      title,
      imageUrl,
      pageIndex,
      isMobile,
      isFullscreen,
      hideText,
      hasText: !!typedText,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }, [title, imageUrl, pageIndex, isMobile, isFullscreen, hideText, typedText]);

  // Layout para dispositivos móveis
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        <div className="story-image-fullscreen h-full w-full relative">
          <CoverImage 
            imageUrl={imageUrl}
            fallbackImage={fallbackImage}
            alt={`Ilustração da página ${pageIndex + 1}`}
            className="w-full h-full object-cover"
            onClick={() => onImageClick(imageUrl)}
            onError={() => onImageError(imageUrl)}
          />
        </div>
        
        {!hideText && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end z-10">
            <div className="relative p-4 sm:p-5 pb-6 bg-black/40 backdrop-blur-md rounded-t-xl">
              <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white text-shadow">{title}</h2>
              <div className="prose prose-sm story-text text-white">
                {typedText.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2 leading-relaxed text-shadow font-medium">{paragraph}</p>
                ))}
                <div className="typing-cursor animate-blink inline-block h-5 w-1 ml-1 bg-white"></div>
              </div>
              
              <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-white/30 text-xs text-white/80 flex justify-between">
                {!isFullscreen && (
                  <span>{childName}</span>
                )}
              </div>
              
              <div className="mt-3 sm:mt-4 flex justify-center gap-2">
                <NarrationPlayer
                  storyId={storyId || ''}
                  pageIndex={pageIndex}
                  pageText={typedText}
                  voiceType={voiceType}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1"
                  autoPlay={!isMobile}
                />
              </div>
            </div>
          </div>
        )}
        
        <Button 
          className="fixed bottom-20 sm:bottom-24 right-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm py-1 px-2 sm:px-3 flex items-center gap-1 shadow-lg"
          size="sm"
          variant="ghost"
          onClick={onToggleTextVisibility}
        >
          {hideText ? <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> : <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />}
          {hideText ? "Mostrar texto" : "Ocultar texto"}
        </Button>
      </div>
    );
  }
  
  // Layout para desktop
  return (
    <div className="w-full h-full flex flex-row">
      <div className="w-1/2 h-full bg-gradient-to-br from-violet-50 to-indigo-50 border-r border-gray-100 flex items-center justify-center p-6 overflow-hidden">
        <CoverImage 
          imageUrl={imageUrl}
          fallbackImage={fallbackImage}
          alt={`Ilustração da página ${pageIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-md"
          onClick={() => onImageClick(imageUrl)}
          onError={() => onImageError(imageUrl)}
        />
      </div>
      
      <div className="w-1/2 h-full bg-white overflow-hidden flex flex-col relative">
        {!hideText ? (
          <>
            <ScrollArea className="h-full pr-2 p-8 bg-white/95">
              <div className="mb-6 bg-white/90 p-5 rounded-lg backdrop-blur-sm shadow-sm">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">{title}</h2>
                <div className="prose prose-lg">
                  {typedText.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3 text-lg leading-relaxed font-medium text-gray-700">{paragraph}</p>
                  ))}
                  <div className="typing-cursor animate-blink inline-block h-6 w-1 ml-1 bg-gray-500"></div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 pt-3 border-t text-sm text-gray-500 flex justify-center items-center bg-white/95 backdrop-blur-sm">
              <NarrationPlayer
                storyId={storyId || ''}
                pageIndex={pageIndex}
                pageText={typedText}
                voiceType={voiceType}
                autoPlay={false}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic">Texto oculto</p>
          </div>
        )}
        
        <Button 
          className="absolute bottom-4 right-4 z-10"
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
