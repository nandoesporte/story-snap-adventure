
import React, { useRef, useEffect } from "react";
import { CoverPage } from "./CoverPage";
import { StoryPage } from "./StoryPage";
import { getImageUrl, preloadImage, fixImageUrl, ensureImagesDirectory } from "./helpers";
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
  
  // Ensure we have default images
  useEffect(() => {
    ensureImagesDirectory();
  }, []);
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/images/defaults/default.jpg";
  
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
          const fixedUrl = fixImageUrl(getImageUrl(currentImageUrl, storyData.theme));
          await preloadImage(fixedUrl);
        }
        
        // Preload next page image if available
        if (currentPage < storyData.pages.length) {
          const nextImageUrl = currentPage === 0 
            ? (storyData.pages[0]?.imageUrl || storyData.pages[0]?.image_url)
            : (storyData.pages[currentPage]?.imageUrl || storyData.pages[currentPage]?.image_url);
            
          if (nextImageUrl) {
            const fixedUrl = fixImageUrl(getImageUrl(nextImageUrl, storyData.theme));
            await preloadImage(fixedUrl);
          }
        }
        
        // Preload previous page image if available
        if (currentPage > 0) {
          const prevImageUrl = currentPage === 1 
            ? coverImageSrc
            : (storyData.pages[currentPage - 2]?.imageUrl || storyData.pages[currentPage - 2]?.image_url);
            
          if (prevImageUrl) {
            const fixedUrl = fixImageUrl(getImageUrl(prevImageUrl, storyData.theme));
            await preloadImage(fixedUrl);
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
          coverImageSrc={fixImageUrl(coverImageSrc)}
          childName={storyData.childName || storyData.characterName}
          theme={storyData.theme || "default"}
          setting={storyData.setting || ""}
          style={storyData.style}
          onImageClick={() => onImageClick(fixImageUrl(coverImageSrc))}
          onImageError={onImageError}
          isMobile={isMobile}
        />
      ) : (
        <StoryPage
          pageNumber={currentPage}
          totalPages={storyData.pages.length}
          text={storyData.pages[currentPage - 1]?.text}
          typedText={storyData.typedText}
          imageUrl={storyData.pages[currentPage - 1]?.imageUrl || storyData.pages[currentPage - 1]?.image_url}
          theme={storyData.theme}
          onImageClick={onImageClick}
          onImageError={onImageError}
          isMobile={isMobile}
          hideText={hideText}
        />
      )}
    </div>
  );
};
