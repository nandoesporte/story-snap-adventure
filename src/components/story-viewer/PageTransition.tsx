
import React, { useRef, useEffect, useState } from "react";
import { CoverPage } from "./CoverPage";
import { StoryPage } from "./StoryPage";
import { getImageUrl } from "./helpers";

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
  const [imagesPreloaded, setImagesPreloaded] = useState<{[key: string]: boolean}>({});

  // Preload the next and previous page images for smoother transitions
  useEffect(() => {
    if (!storyData || !storyData.pages) return;
    
    const pagesToPreload = [];
    
    // Always preload current page
    if (currentPage > 0 && currentPage <= storyData.pages.length) {
      pagesToPreload.push(currentPage - 1);
    }
    
    // Preload next page
    if (currentPage < storyData.pages.length) {
      pagesToPreload.push(currentPage);
    }
    
    // Preload previous page
    if (currentPage > 1) {
      pagesToPreload.push(currentPage - 2);
    }
    
    // Preload cover
    if (currentPage <= 1) {
      const coverUrl = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
      if (!imagesPreloaded[coverUrl]) {
        const img = new Image();
        img.src = coverUrl;
        img.onload = () => {
          setImagesPreloaded(prev => ({...prev, [coverUrl]: true}));
        };
      }
    }
    
    // Preload identified pages
    pagesToPreload.forEach(pageIndex => {
      if (pageIndex >= 0 && pageIndex < storyData.pages.length) {
        const imageUrl = getImageUrl(
          storyData.pages[pageIndex]?.imageUrl || 
          storyData.pages[pageIndex]?.image_url,
          storyData.theme
        );
        
        if (!imagesPreloaded[imageUrl]) {
          const img = new Image();
          img.src = imageUrl;
          img.onload = () => {
            setImagesPreloaded(prev => ({...prev, [imageUrl]: true}));
          };
        }
      }
    });
  }, [storyData, currentPage, imagesPreloaded]);
  
  if (!storyData) return null;
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  return (
    <div
      ref={bookRef}
      className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
        isFlipping ? (flipDirection === "left" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0") : ""
      } ${isRendered ? 'opacity-100' : 'opacity-0'}`}
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
