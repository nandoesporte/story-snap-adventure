
import { useState, useCallback } from "react";

export const useImageViewer = () => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageZoom, setImageZoom] = useState(1);
  
  const handleImageClick = useCallback((imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setImageZoom(1); // Reset zoom when opening new image
    setShowImageViewer(true);
  }, []);
  
  const handleZoomIn = useCallback(() => {
    setImageZoom(prev => Math.min(prev + 0.25, 3));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setImageZoom(prev => Math.max(prev - 0.25, 0.5));
  }, []);
  
  // Reset zoom when closing viewer
  const handleCloseViewer = useCallback(() => {
    setShowImageViewer(false);
    // Add a small delay before resetting zoom to avoid jump during transition
    setTimeout(() => {
      setImageZoom(1);
    }, 300);
  }, []);
  
  return {
    showImageViewer,
    setShowImageViewer: handleCloseViewer,
    currentImageUrl,
    imageZoom,
    handleImageClick,
    handleZoomIn,
    handleZoomOut
  };
};
