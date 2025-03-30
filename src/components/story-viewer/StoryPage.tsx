
import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NarrationPlayer } from "../NarrationPlayer";

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
  // Log de debugging para verificar props
  console.log("StoryPage rendering with props:", { 
    title, imageUrl, isMobile, hideText, typedText: typedText.substring(0, 20) + "..."
  });

  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        <div className="story-image-fullscreen">
          <img 
            src={imageUrl} 
            alt={`Ilustração da página ${pageIndex + 1}`}
            className="w-full h-full object-cover"
            onClick={() => onImageClick(imageUrl)}
            onError={() => onImageError(imageUrl)}
          />
        </div>
        
        {!hideText && (
          <div className="story-text-overlay">
            <div className="relative z-10 p-4 pb-6">
              <h2 className="text-xl font-bold mb-3 text-white text-shadow">{title}</h2>
              <div className="prose prose-sm story-text text-white">
                {typedText.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-2 leading-relaxed text-shadow">{paragraph}</p>
                ))}
                <div className="typing-cursor animate-blink inline-block h-5 w-1 ml-1 bg-white"></div>
              </div>
              <div className="pt-3 mt-3 border-t border-white/30 text-xs text-white/80 flex justify-between">
                {!isFullscreen && (
                  <>
                    <span>Página {pageIndex + 1} de {pageCount}</span>
                    <span>{childName}</span>
                  </>
                )}
              </div>
              
              <div className="mt-4 flex justify-center gap-2">
                <NarrationPlayer
                  storyId={storyId || ''}
                  pageIndex={pageIndex}
                  pageText={typedText}
                  voiceType={voiceType}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1"
                />
              </div>
            </div>
          </div>
        )}
        
        <Button 
          className="fixed bottom-24 right-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 flex items-center gap-1 shadow-lg"
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
  
  return (
    <div className="w-full h-full flex flex-row">
      <div className="w-1/2 h-full bg-gradient-to-br from-violet-50 to-indigo-50 border-r border-gray-100 flex items-center justify-center p-6 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={`Ilustração da página ${pageIndex + 1}`}
          className="max-w-full max-h-full object-contain cursor-pointer rounded-lg shadow-md"
          onClick={() => onImageClick(imageUrl)}
          onError={() => onImageError(imageUrl)}
        />
      </div>
      
      <div className="w-1/2 h-full bg-white overflow-hidden flex flex-col justify-between relative">
        {!hideText ? (
          <>
            <ScrollArea className="h-full pr-2 p-8">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">{title}</h2>
                <div className="prose prose-lg">
                  {typedText.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-3 text-lg">{paragraph}</p>
                  ))}
                  <div className="typing-cursor animate-blink inline-block h-6 w-1 ml-1 bg-gray-500"></div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 pt-3 border-t text-sm text-gray-500 flex justify-between items-center">
              {!isFullscreen && (
                <>
                  <span>Página {pageIndex + 1} de {pageCount}</span>
                  <span>{childName}</span>
                </>
              )}
              <NarrationPlayer
                storyId={storyId || ''}
                pageIndex={pageIndex}
                pageText={typedText}
                voiceType={voiceType}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 italic">Texto oculto</p>
          </div>
        )}
        
        {!isMobile && !hideText && (
          <Button 
            className="absolute bottom-4 right-4 z-10"
            size="sm"
            variant="secondary"
            onClick={onToggleTextVisibility}
          >
            <EyeOff className="w-4 h-4" />
            Ocultar texto
          </Button>
        )}
      </div>
    </div>
  );
};
