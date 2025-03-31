
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
  onImageClick,
  onImageError,
  onToggleTextVisibility
}) => {
  const bookRef = useRef<HTMLDivElement>(null);
  const [preloadComplete, setPreloadComplete] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log("PageTransition rendering with:", {
      currentPage,
      isMobile,
      isFullscreen,
      hasStoryData: !!storyData,
      isRendered,
      preloadComplete,
      imageLoadError
    });
  }, [currentPage, isMobile, isFullscreen, storyData, isRendered, preloadComplete, imageLoadError]);
  
  // Check if we have story data
  if (!storyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum conteúdo de história disponível</p>
      </div>
    );
  }
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  // Handle image errors
  const handleImageLoadError = (url: string) => {
    console.error("Image failed to load:", url);
    setImageLoadError(true);
    onImageError(url);
  };
  
  // Preload next and previous page images to improve transitions
  useEffect(() => {
    if (!storyData || !storyData.pages || storyData.pages.length === 0) return;
    
    const preloadAdjacentPages = async () => {
      try {
        setPreloadComplete(false);
        
        // Preload current page image
        const currentImageUrl = currentPage === 0 
          ? coverImageSrc 
          : (storyData.pages[currentPage - 1]?.imageUrl || storyData.pages[currentPage - 1]?.image_url);
          
        if (currentImageUrl) {
          try {
            await preloadImage(getImageUrl(currentImageUrl, storyData.theme));
          } catch (error) {
            console.warn("Failed to preload current page image:", error);
          }
        }
        
        // Preload next page image if available
        if (currentPage < storyData.pages.length) {
          const nextImageUrl = currentPage === 0 
            ? (storyData.pages[0]?.imageUrl || storyData.pages[0]?.image_url)
            : (storyData.pages[currentPage]?.imageUrl || storyData.pages[currentPage]?.image_url);
            
          if (nextImageUrl) {
            try {
              await preloadImage(getImageUrl(nextImageUrl, storyData.theme));
            } catch (error) {
              console.warn("Failed to preload next page image:", error);
            }
          }
        }
        
        // Preload previous page image if available
        if (currentPage > 0) {
          const prevImageUrl = currentPage === 1 
            ? coverImageSrc
            : (storyData.pages[currentPage - 2]?.imageUrl || storyData.pages[currentPage - 2]?.image_url);
            
          if (prevImageUrl) {
            try {
              await preloadImage(getImageUrl(prevImageUrl, storyData.theme));
            } catch (error) {
              console.warn("Failed to preload previous page image:", error);
            }
          }
        }
        
        setPreloadComplete(true);
      } catch (error) {
        console.error("Error preloading adjacent pages:", error);
        setPreloadComplete(true); // Continue anyway
      }
    };
    
    preloadAdjacentPages();
  }, [currentPage, storyData, coverImageSrc]);
  
  // Calculate transition classes based on state
  const transitionClasses = `
    absolute inset-0 
    transition-all duration-300 ease-in-out 
    ${isFlipping ? (flipDirection === "left" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0") : "translate-x-0"} 
    ${isRendered ? 'opacity-100' : 'opacity-0'}
  `;
  
  return (
    <div
      ref={bookRef}
      className={transitionClasses}
      data-testid="story-book-container"
      style={{ width: '100%', height: '100%' }}
    >
      {currentPage === 0 ? (
        <CoverPage
          title={storyData.title}
          coverImageSrc={coverImageSrc}
          childName={storyData.childName}
          theme={storyData.theme}
          setting={storyData.setting}
          style={storyData.style}
          isMobile={isMobile}
          onImageClick={onImageClick}
          onImageError={handleImageLoadError}
        />
      ) : (
        <StoryPage
          storyId={storyId}
          title={storyData.title}
          imageUrl={getImageUrl(
            storyData.pages[currentPage - 1]?.imageUrl || 
            storyData.pages[currentPage - 1]?.image_url,
            storyData.theme
          )}
          pageIndex={currentPage - 1}
          pageCount={storyData.pages.length}
          childName={storyData.childName}
          typedText={storyData.typedText}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          hideText={hideText}
          voiceType={storyData.voiceType || 'female'}
          onImageClick={onImageClick}
          onImageError={handleImageLoadError}
          onToggleTextVisibility={onToggleTextVisibility}
        />
      )}
    </div>
  );
};
