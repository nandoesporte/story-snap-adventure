
import React, { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
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
    handleImageError 
  } = useStoryData(storyId);
  
  const { id } = useParams<{ id?: string }>();
  const effectiveStoryId = storyId || id;
  const navigate = useNavigate();
  
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
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
    toggleTextVisibility
  } = useStoryNavigation(storyData, isMobile);
  
  const {
    isFullscreen,
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
          
          <div className="flex-1 relative overflow-hidden">
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
              onImageError={handleImageError}
              onToggleTextVisibility={toggleTextVisibility}
            />
            
            <StoryNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              isFlipping={isFlipping}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
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
