
import React, { useRef, useEffect, useState } from "react";
import { CoverPage } from "./CoverPage";
import { StoryPage } from "./StoryPage";
import { getImageUrl, preloadImage } from "./helpers";
import { toast } from "sonner";

interface PageTransitionProps {
  storyId: string | undefined;
  storyData: any;
  currentPage: number;
  isFlipping: boolean;
  flipDirection: "left" | "right";
  isRendered: boolean;
  isFullscreen: boolean;
  isMobile: boolean;
  hideText: boolean;
  windowWidth: number;
  windowHeight: number;
  onImageClick: (url: string) => void;
  onImageError: (url: string) => void;
  onToggleTextVisibility: () => void;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  storyId,
  storyData,
  currentPage,
  isFlipping,
  flipDirection,
  isRendered,
  isFullscreen,
  isMobile,
  hideText,
  windowWidth,
  windowHeight,
  onImageClick,
  onImageError,
  onToggleTextVisibility
}) => {
  const bookRef = useRef<HTMLDivElement>(null);
  const [contentKey, setContentKey] = useState<number>(0);
  
  // Debug log
  useEffect(() => {
    console.log("PageTransition rendered:", {
      currentPage,
      isMobile,
      isFullscreen,
      hasStoryData: !!storyData,
      isRendered,
      viewportWidth: windowWidth,
      viewportHeight: windowHeight,
      mode: isFullscreen ? "fullscreen" : "regular",
      contentKey
    });
  }, [currentPage, isMobile, isFullscreen, storyData, isRendered, windowWidth, windowHeight, contentKey]);
  
  // Force re-render when window dimensions change significantly
  useEffect(() => {
    setContentKey(prev => prev + 1);
  }, [isFullscreen, isMobile]);
  
  // Check if we have story data
  if (!storyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No story content available</p>
      </div>
    );
  }
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  // Preload images of adjacent pages to improve transitions
  useEffect(() => {
    if (!storyData || !storyData.pages || storyData.pages.length === 0) return;
    
    const preloadAdjacentPages = async () => {
      try {
        // Preload current page image
        const currentImageUrl = currentPage === 0 
          ? coverImageSrc 
          : (storyData.pages[currentPage - 1]?.imageUrl || storyData.pages[currentPage - 1]?.image_url);
          
        if (currentImageUrl) {
          await preloadImage(getImageUrl(currentImageUrl, storyData.theme));
        }
        
        // Preload next page image if available
        if (currentPage < storyData.pages.length) {
          const nextImageUrl = currentPage === 0 
            ? (storyData.pages[0]?.imageUrl || storyData.pages[0]?.image_url)
            : (storyData.pages[currentPage]?.imageUrl || storyData.pages[currentPage]?.image_url);
            
          if (nextImageUrl) {
            await preloadImage(getImageUrl(nextImageUrl, storyData.theme));
          }
        }
        
        // Preload previous page image if available
        if (currentPage > 0) {
          const prevImageUrl = currentPage === 1 
            ? coverImageSrc
            : (storyData.pages[currentPage - 2]?.imageUrl || storyData.pages[currentPage - 2]?.image_url);
            
          if (prevImageUrl) {
            await preloadImage(getImageUrl(prevImageUrl, storyData.theme));
          }
        }
      } catch (error) {
        console.error("Error preloading adjacent pages:", error);
      }
    };
    
    preloadAdjacentPages();
  }, [currentPage, storyData, coverImageSrc]);
  
  // Calculate transition classes based on state
  const transitionClasses = `
    absolute inset-0 w-full h-full
    transition-all duration-300 ease-in-out 
    ${isFlipping ? (flipDirection === "left" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0") : "translate-x-0"} 
    ${isRendered ? 'opacity-100' : 'opacity-0'}
  `;
  
  return (
    <div
      ref={bookRef}
      className={transitionClasses}
      data-testid="story-book-container"
      style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
      key={`page-content-${contentKey}-${isFullscreen ? 'fullscreen' : 'regular'}-${isMobile ? 'mobile' : 'desktop'}`}
    >
      {currentPage === 0 ? (
        <CoverPage
          title={storyData.title || "Untitled Story"}
          coverImageSrc={coverImageSrc}
          childName={storyData.childName || "child"}
          theme={storyData.theme || ""}
          setting={storyData.setting || ""}
          style={storyData.style || ""}
          isMobile={isMobile}
          onImageClick={onImageClick}
          onImageError={onImageError}
        />
      ) : (
        <StoryPage
          storyId={storyId}
          title={storyData.title || "Untitled Story"}
          imageUrl={getImageUrl(
            storyData.pages[currentPage - 1]?.imageUrl || 
            storyData.pages[currentPage - 1]?.image_url,
            storyData.theme
          )}
          pageIndex={currentPage - 1}
          pageCount={storyData.pages?.length || 0}
          childName={storyData.childName || "child"}
          typedText={storyData.typedText || storyData.pages[currentPage - 1]?.text || ""}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          hideText={hideText}
          voiceType={storyData.voiceType || 'female'}
          onImageClick={onImageClick}
          onImageError={onImageError}
          onToggleTextVisibility={onToggleTextVisibility}
        />
      )}
    </div>
  );
}
