
import React, { useRef, useEffect } from "react";
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
  
  // Debug logging
  useEffect(() => {
    console.log("PageTransition rendering with:", {
      currentPage,
      isMobile,
      isFullscreen,
      hasStoryData: !!storyData,
      isRendered
    });
  }, [currentPage, isMobile, isFullscreen, storyData, isRendered]);
  
  // Check if we have story data
  if (!storyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum conteúdo de história disponível</p>
      </div>
    );
  }
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  // Preload next and previous page images to improve transitions
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
  const getTransitionClasses = () => {
    let baseClasses = "absolute inset-0 transition-all duration-500 ease-in-out perspective";
    
    if (isFlipping) {
      // Apply 3D rotation effect for page flipping
      if (flipDirection === "left") {
        return `${baseClasses} transform -translate-x-1/2 rotate-y-[-15deg] opacity-90`;
      } else {
        return `${baseClasses} transform translate-x-1/2 rotate-y-[15deg] opacity-90`;
      }
    }
    
    return `${baseClasses} ${isRendered ? 'opacity-100' : 'opacity-0'}`;
  };
  
  return (
    <div
      ref={bookRef}
      className={getTransitionClasses()}
      data-testid="story-book-container"
      style={{ 
        width: '100%', 
        height: '100%',
        perspective: '1500px',
        transformStyle: 'preserve-3d'
      }}
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
          onImageError={onImageError}
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
          onImageError={onImageError}
          onToggleTextVisibility={onToggleTextVisibility}
        />
      )}
    </div>
  );
};
