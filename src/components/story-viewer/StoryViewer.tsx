
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
  const isMobile = useIsMobile();
  const [isContentReady, setIsContentReady] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
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

  // Make sure content is ready after loading
  useEffect(() => {
    if (!loading && storyData) {
      // Add a small delay to ensure all components are ready
      const timer = setTimeout(() => {
        setIsContentReady(true);
        console.log("Story content is ready to display");
      }, 500); // Increased delay to ensure images have time to load
      
      return () => clearTimeout(timer);
    }
  }, [loading, storyData]);

  // Effect to maintain correct visual state when toggling fullscreen
  useEffect(() => {
    preserveFullscreenState(isFullscreen);
  }, [isFullscreen, preserveFullscreenState]);
  
  // Add a handler to fix white screen issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && storyData) {
        // Document became visible again, check if update is needed
        console.log("Document became visible again, checking if update is needed");
        setTimeout(() => {
          forcePageReset();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add a listener for unhandled loading errors
    const handleUnhandledErrors = (event: ErrorEvent) => {
      if (event.message.includes('loading chunk') || 
          event.message.includes('loading CSS chunk') ||
          event.message.includes('Failed to load resource')) {
        console.error("Loading error detected:", event.message);
        setHasErrors(true);
        setErrorCount(prev => prev + 1);
      }
    };
    
    window.addEventListener('error', handleUnhandledErrors);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleUnhandledErrors);
    };
  }, [storyData, forcePageReset, errorCount]);
  
  // Enhanced image error handling
  const handleStoryImageError = (url: string) => {
    console.error("Image failed to load:", url);
    setErrorCount(prev => prev + 1);
    handleImageError(url);
  };
  
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
    console.log("Recarregando página...");
    forcePageReset();
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
    <div className="relative w-full h-full bg-amber-50/40 flex flex-col overflow-hidden font-sans">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div 
          ref={storyContainerRef} 
          className="flex-1 flex flex-col h-full overflow-hidden"
          data-testid="story-viewer-container"
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
                onImageClick={handleImageClick}
                onImageError={handleStoryImageError}
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

export default StoryViewer;
