
import { useState, useEffect, useCallback } from "react";
import { useTypingEffect } from "./useTypingEffect";

export const useStoryNavigation = (storyData: any, isMobile: boolean) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [isRendered, setIsRendered] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [lastFullscreenState, setLastFullscreenState] = useState(false);

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

  useEffect(() => {
    if (storyData) {
      setTotalPages(storyData.pages.length + 1);
      
      setTimeout(() => {
        setIsRendered(true);
      }, 100);
    }
  }, [storyData]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection("left");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  }, [currentPage, isFlipping]);
  
  const handleNextPage = useCallback(() => {
    if (storyData && currentPage < totalPages - 1 && !isFlipping) {
      setFlipDirection("right");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  }, [currentPage, isFlipping, storyData, totalPages]);

  const toggleTextVisibility = useCallback(() => {
    setHideText(!hideText);
  }, [hideText]);

  // Para preservar o estado ao alternar entre tela cheia
  const preserveFullscreenState = useCallback((isNowFullscreen: boolean) => {
    setLastFullscreenState(isNowFullscreen);
    // Se estiver saindo da tela cheia, garanta que a página atual seja recarregada
    if (!isNowFullscreen && lastFullscreenState) {
      setIsFlipping(true);
      setTimeout(() => {
        setIsFlipping(false);
      }, 100);
    }
  }, [lastFullscreenState]);

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
    preserveFullscreenState
  };
};
