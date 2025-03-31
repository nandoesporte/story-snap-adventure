
import { useState, useEffect, useCallback } from "react";
import { useTypingEffect } from "./useTypingEffect";
import { toast } from "sonner";

export const useStoryNavigation = (storyData: any, isMobile: boolean) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [isRendered, setIsRendered] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [lastFullscreenState, setLastFullscreenState] = useState(false);
  const [pageReset, setPageReset] = useState(false);
  const [lastMobileState, setLastMobileState] = useState(isMobile);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Calculate current page text
  const currentPageIndex = currentPage > 0 ? currentPage - 1 : 0;
  const currentText = storyData && currentPage > 0 && storyData.pages[currentPage - 1] 
    ? storyData.pages[currentPage - 1].text 
    : "";
  
  const typedText = useTypingEffect(
    currentText, 
    currentPage, 
    30, 
    true, 
    800, 
    isMobile ? 400 : undefined
  );

  // Detect responsive view changes
  useEffect(() => {
    if (lastMobileState !== isMobile) {
      console.log("Responsive view changed:", isMobile ? "mobile" : "desktop");
      setLastMobileState(isMobile);
      
      // Force page refresh when switching between mobile/desktop
      if (storyData && currentPage > 0) {
        forcePageReset();
      }
    }
  }, [isMobile, storyData, currentPage]);

  useEffect(() => {
    if (storyData) {
      setTotalPages(storyData.pages.length + 1);
      
      // Add a small delay to ensure components are mounted properly
      setTimeout(() => {
        setIsRendered(true);
      }, 100);
    }
  }, [storyData]);

  // Reset page effect - when there are problems with white page
  useEffect(() => {
    if (pageReset) {
      const timer = setTimeout(() => {
        setPageReset(false);
        setIsFlipping(false);
        
        if (loadAttempts > 3) {
          toast.info("Se a página continuar branca, tente recarregar a página inteira", {
            duration: 4000
          });
          setLoadAttempts(0);
        }
      }, 500); // Increased from 300ms to 500ms for better effect
      
      return () => clearTimeout(timer);
    }
  }, [pageReset, loadAttempts]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection("left");
      setIsFlipping(true);
      
      // Create 3D page turn effect with animation timing
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        
        // Add a small delay before completing the animation
        setTimeout(() => {
          setIsFlipping(false);
        }, 300);
      }, 300);
    }
  }, [currentPage, isFlipping]);
  
  const handleNextPage = useCallback(() => {
    if (storyData && currentPage < totalPages - 1 && !isFlipping) {
      setFlipDirection("right");
      setIsFlipping(true);
      
      // Create 3D page turn effect with animation timing
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        
        // Add a small delay before completing the animation
        setTimeout(() => {
          setIsFlipping(false);
        }, 300);
      }, 300);
    }
  }, [currentPage, isFlipping, storyData, totalPages]);

  const toggleTextVisibility = useCallback(() => {
    setHideText(!hideText);
  }, [hideText]);

  // Preserve state when toggling fullscreen
  const preserveFullscreenState = useCallback((isNowFullscreen: boolean) => {
    setLastFullscreenState(isNowFullscreen);
    
    // Force a page update when exiting fullscreen
    if (!isNowFullscreen && lastFullscreenState) {
      console.log("Exiting fullscreen, forcing page update");
      forcePageReset();
    }
  }, [lastFullscreenState]);

  // Function to force page reset in case of white screen
  const forcePageReset = useCallback(() => {
    console.log("Forcing page reset to fix white screen");
    setIsFlipping(true);
    setPageReset(true);
    setLoadAttempts(prev => prev + 1);
    
    const currentPageCopy = currentPage;
    
    // First, go back to cover page (page 0)
    setCurrentPage(0);
    
    // After a short delay, return to the previous page
    setTimeout(() => {
      setCurrentPage(currentPageCopy);
      
      // Ensure the transition animation completes
      setTimeout(() => {
        setIsFlipping(false);
      }, 500);
    }, 100);
  }, [currentPage]);

  return {
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
  };
};
