
import { useState, useEffect } from "react";
import { useTypingEffect } from "./useTypingEffect";

export const useStoryNavigation = (storyData: any, isMobile: boolean) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [isRendered, setIsRendered] = useState(false);
  const [hideText, setHideText] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

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

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setFlipDirection("left");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  };
  
  const handleNextPage = () => {
    if (storyData && currentPage < totalPages - 1) {
      setFlipDirection("right");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const toggleTextVisibility = () => {
    setHideText(!hideText);
  };

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
    toggleTextVisibility
  };
};
