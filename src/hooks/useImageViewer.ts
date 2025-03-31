
import { useState } from "react";

export const useImageViewer = () => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imageZoom, setImageZoom] = useState(1);

  const handleImageClick = (url: string) => {
    if (url === "/placeholder.svg" || url.includes("/images/placeholders/")) {
      return;
    }
    setCurrentImageUrl(url);
    setShowImageViewer(true);
    setImageZoom(1);
  };
  
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.2, 3));
  };
  
  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  return {
    showImageViewer,
    setShowImageViewer,
    currentImageUrl,
    imageZoom,
    handleImageClick,
    handleZoomIn,
    handleZoomOut
  };
};
