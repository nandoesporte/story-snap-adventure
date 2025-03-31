
import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "../LoadingSpinner";
import { useStoryData } from "./useStoryData";
import { ViewerControls } from "./ViewerControls";
import { ImageViewer } from "./ImageViewer";
import { PageTransition } from "./PageTransition";
import { StoryNavigation } from "./StoryNavigation";
import { useStoryNavigation } from "@/hooks/useStoryNavigation";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useImageViewer } from "@/hooks/useImageViewer";
import { toast } from "sonner";

interface StoryViewerProps {
  storyId?: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ storyId }) => {
  const { 
    storyData, 
    loading, 
    handleImageError,
    error
  } = useStoryData(storyId);
  
  const { id } = useParams<{ id?: string }>();
  const effectiveStoryId = storyId || id;
  const navigate = useNavigate();
  
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const { isMobile, windowWidth, windowHeight } = useIsMobile();
  const [isContentReady, setIsContentReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  
  // Custom hooks
  const {
    currentPage,
    setCurrentPage,
    isFlipping,
    flipDirection,
    isRendered,
    hideText,
    totalPages,
    typedText,
    handlePreviousPage,
    handleNextPage,
    toggleTextVisibility,
    preserveFullscreenState,
    forcePageReset
  } = useStoryNavigation(storyData, isMobile);
  
  const {
    isFullscreen,
    isTransitioning,
    toggleFullscreen
  } = useFullscreen();
  
  const {
    isDownloading,
    generatePDF
  } = usePDFGenerator();
  
  const {
    showImageViewer,
    setShowImageViewer,
    currentImageUrl,
    imageZoom,
    handleImageClick,
    handleZoomIn,
    handleZoomOut
  } = useImageViewer();

  // Log inicial para depuração
  useEffect(() => {
    console.log("StoryViewer montado com estado inicial:", {
      isMobile,
      viewportWidth: windowWidth,
      viewportHeight: windowHeight,
      hasStoryData: !!storyData,
      storyId: effectiveStoryId,
      isFullscreen,
      currentPage,
      forceRender
    });
  }, [isMobile, storyData, effectiveStoryId, isFullscreen, currentPage, windowWidth, windowHeight, forceRender]);

  // Garantir que o conteúdo esteja pronto após o carregamento
  useEffect(() => {
    if (!loading && storyData) {
      // Adicionar um pequeno atraso para garantir que todos os componentes estejam prontos
      const timer = setTimeout(() => {
        setIsContentReady(true);
        setHasInitialized(true);
        console.log("Conteúdo da história pronto para exibição", {
          storyDataExists: !!storyData,
          pageCount: storyData?.pages?.length || 0,
          coverImage: storyData?.cover_image_url || storyData?.coverImageUrl,
          mode: isFullscreen ? "fullscreen" : "regular",
          deviceType: isMobile ? "mobile" : "desktop",
          dimensions: { width: windowWidth, height: windowHeight }
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, storyData, isFullscreen, isMobile, windowWidth, windowHeight]);

  // Forçar uma reinicialização quando o tamanho da tela muda drasticamente
  useEffect(() => {
    console.log("Mudança de estado detectada:", { 
      isMobile, 
      isFullscreen, 
      width: windowWidth, 
      height: windowHeight 
    });
    
    if (hasInitialized && storyData) {
      // Pequeno atraso para garantir que o DOM foi atualizado
      const timer = setTimeout(() => {
        forcePageReset();
        setForceRender(prev => prev + 1);
        console.log("Forçando reset após mudança de tamanho de tela");
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isMobile, hasInitialized, storyData, forcePageReset, isFullscreen, windowWidth, windowHeight]);

  // Efeito para manter o estado visual correto ao alternar tela cheia
  useEffect(() => {
    preserveFullscreenState(isFullscreen);
  }, [isFullscreen, preserveFullscreenState]);
  
  // Adicionar um manipulador para resolver problemas de tela branca
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && storyData) {
        // Documento voltou a ficar visível, verificar se precisa atualizar
        console.log("Documento voltou a ficar visível, verificando necessidade de atualização");
        setTimeout(() => {
          forcePageReset();
          setForceRender(prev => prev + 1);
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Adiciona um ouvinte para erros de carregamento de imagem
    const handleUnhandledErrors = (event: ErrorEvent) => {
      if (event.message.includes('loading chunk') || 
          event.message.includes('loading CSS chunk') ||
          event.message.includes('Failed to load resource')) {
        console.error("Erro de carregamento detectado:", event.message);
        forcePageReset();
        setForceRender(prev => prev + 1);
      }
    };
    
    window.addEventListener('error', handleUnhandledErrors);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleUnhandledErrors);
    };
  }, [storyData, forcePageReset]);
  
  // Prepare data for child components
  const storyDataWithTypedText = storyData ? {
    ...storyData,
    typedText
  } : null;
  
  const handleDownloadPDF = () => {
    generatePDF(bookRef, storyData, setCurrentPage);
  };
  
  const handleToggleFullscreen = () => {
    toggleFullscreen(storyContainerRef);
  };
  
  const handleResetPage = () => {
    toast.info("Recarregando página...");
    forcePageReset();
    setForceRender(prev => prev + 1);
  };

  // Handle error cases
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8">
        <p className="text-red-500">Erro ao carregar a história</p>
        <Button 
          onClick={handleResetPage}
          variant="outline"
          size="sm"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div 
          ref={storyContainerRef} 
          className="flex-1 flex flex-col h-full overflow-hidden"
          data-testid="story-viewer-container"
          key={`story-container-${forceRender}-${isFullscreen ? 'fullscreen' : 'regular'}-${isMobile ? 'mobile' : 'desktop'}`}
        >
          <ViewerControls
            storyId={effectiveStoryId}
            title={storyData?.title || ""}
            currentPage={currentPage}
            totalPages={totalPages}
            isDownloading={isDownloading}
            isFullscreen={isFullscreen}
            isMobile={isMobile}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            onDownloadPDF={handleDownloadPDF}
            onToggleFullscreen={handleToggleFullscreen}
          />
          
          <div className={`flex-1 relative overflow-hidden ${isTransitioning ? 'opacity-95' : ''}`}>
            {isContentReady && storyData && (
              <PageTransition
                storyId={effectiveStoryId}
                storyData={storyDataWithTypedText}
                currentPage={currentPage}
                isFlipping={isFlipping}
                flipDirection={flipDirection}
                isRendered={isRendered}
                isFullscreen={isFullscreen}
                isMobile={isMobile}
                hideText={hideText}
                windowWidth={windowWidth}
                windowHeight={windowHeight}
                onImageClick={handleImageClick}
                onImageError={handleImageError}
                onToggleTextVisibility={toggleTextVisibility}
              />
            )}
            
            <StoryNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              isFlipping={isFlipping}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              onReset={handleResetPage}
            />
          </div>
        </div>
      )}
      
      <ImageViewer
        open={showImageViewer}
        onOpenChange={setShowImageViewer}
        imageUrl={currentImageUrl}
        zoom={imageZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  );
};

// Adicionando declaração de tipo global para o timer de redimensionamento
declare global {
  interface Window {
    resizeTimer: ReturnType<typeof setTimeout> | null;
  }
}

// Inicialização
window.resizeTimer = null;

export default StoryViewer;
