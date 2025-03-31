
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import LoadingSpinner from "../LoadingSpinner";
import { getImageUrl, getFallbackImage } from "./helpers";
import { useStoryData } from "./useStoryData";
import { ViewerControls } from "./ViewerControls";
import { CoverPage } from "./CoverPage";
import { StoryPage } from "./StoryPage";
import { ImageViewer } from "./ImageViewer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryViewerProps {
  storyId?: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ storyId }) => {
  const { 
    storyData, 
    loading, 
    totalPages, 
    handleImageError 
  } = useStoryData(storyId);
  
  const { id } = useParams<{ id?: string }>();
  const effectiveStoryId = storyId || id;
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [hideText, setHideText] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  
  const bookRef = useRef<HTMLDivElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const currentPageIndex = currentPage > 0 ? currentPage - 1 : 0;
  const currentPageText = storyData && currentPage > 0 && storyData.pages[currentPageIndex] 
    ? storyData.pages[currentPageIndex].text 
    : "";
  
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
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  useEffect(() => {
    if (storyData && !loading) {
      console.log("Story data loaded, showing cover page");
      setCurrentPage(0);
      
      setTimeout(() => {
        setIsRendered(true);
        console.log("Story viewer marked as rendered");
      }, 100);
    }
  }, [storyData, loading]);
  
  useEffect(() => {
    // Reset image errors when story data changes
    setImageLoadErrors({});
  }, [storyData]);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (storyContainerRef.current) {
        storyContainerRef.current.requestFullscreen().catch(err => {
          toast.error(`Erro ao entrar em tela cheia: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen().catch(err => {
        toast.error(`Erro ao sair da tela cheia: ${err.message}`);
      });
    }
  };

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
  
  const handleDownloadPDF = async () => {
    if (!storyData) return;
    
    try {
      setIsDownloading(true);
      toast.info("Preparando o PDF da história...");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      if (bookRef.current) {
        setCurrentPage(0);
        await new Promise(r => setTimeout(r, 500));
        
        const coverCanvas = await html2canvas(bookRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        const coverImgData = coverCanvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(coverImgData, "JPEG", 0, 0, 297, 210);
      }
      
      for (let i = 0; i < storyData.pages.length; i++) {
        pdf.addPage();
        setCurrentPage(i + 1);
        
        await new Promise(r => setTimeout(r, 500));
        
        if (bookRef.current) {
          const canvas = await html2canvas(bookRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
        }
      }
      
      setCurrentPage(0);
      pdf.save(`${storyData.title.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF da história baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF da história");
    } finally {
      setIsDownloading(false);
    }
  };

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
  
  const toggleTextVisibility = () => {
    setHideText(!hideText);
  };
  
  const handleLocalImageError = (url: string) => {
    console.error("Image failed to load:", url);
    
    // Record the error
    setImageLoadErrors(prev => {
      const newErrors = { ...prev, [url]: true };
      
      // Show toast only on first few errors to avoid spamming
      if (Object.keys(newErrors).length === 1) {
        toast.error("Some images could not be loaded. Displaying alternative images.", {
          id: "image-load-error",
          duration: 3000
        });
      }
      
      return newErrors;
    });
    
    // Call the parent error handler
    handleImageError(url);
  };

  return (
    <div className="relative w-full h-full bg-gray-50 flex flex-col overflow-hidden">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div 
          ref={storyContainerRef} 
          className="flex-1 flex flex-col h-full overflow-hidden"
          data-testid="story-viewer-container"
        >
          <ViewerControls
            storyId={effectiveStoryId}
            title={storyData?.title || ""}
            currentPage={currentPage}
            totalPages={totalPages}
            isDownloading={isDownloading}
            isFullscreen={isFullscreen}
            isMobile={isMobile}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            onDownloadPDF={handleDownloadPDF}
            onToggleFullscreen={toggleFullscreen}
          />
          
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={bookRef}
              className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                isFlipping ? (flipDirection === "left" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0") : ""
              } ${isRendered ? 'opacity-100' : 'opacity-0'}`}
              data-testid="story-book-container"
              style={{ width: '100%', height: '100%' }}
            >
              {storyData && (
                <>
                  {currentPage === 0 ? (
                    <CoverPage
                      title={storyData.title}
                      coverImageSrc={coverImageSrc}
                      childName={storyData.childName}
                      theme={storyData.theme}
                      setting={storyData.setting}
                      style={storyData.style}
                      isMobile={isMobile}
                      onImageClick={handleImageClick}
                      onImageError={(url) => handleLocalImageError(url)}
                    />
                  ) : (
                    <StoryPage
                      storyId={effectiveStoryId}
                      title={storyData.title}
                      imageUrl={getImageUrl(
                        storyData.pages[currentPage - 1]?.imageUrl || 
                        storyData.pages[currentPage - 1]?.image_url,
                        storyData.theme
                      )}
                      pageIndex={currentPage - 1}
                      pageCount={storyData.pages.length}
                      childName={storyData.childName}
                      typedText={typedText}
                      isFullscreen={isFullscreen}
                      isMobile={isMobile}
                      hideText={hideText}
                      voiceType={storyData.voiceType || 'female'}
                      onImageClick={handleImageClick}
                      onImageError={() => handleLocalImageError(
                        storyData.pages[currentPage - 1]?.imageUrl || 
                        storyData.pages[currentPage - 1]?.image_url || ""
                      )}
                      onToggleTextVisibility={toggleTextVisibility}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="absolute inset-y-0 left-2 flex items-center z-20">
            {currentPage > 0 && !isFlipping && (
              <Button
                onClick={handlePreviousPage}
                className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <div className="absolute inset-y-0 right-2 flex items-center z-20">
            {storyData && currentPage < totalPages - 1 && !isFlipping && (
              <Button
                onClick={handleNextPage}
                className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-gray-800"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      <ImageViewer
        open={showImageViewer}
        onOpenChange={setShowImageViewer}
        imageUrl={currentImageUrl}
        zoom={imageZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
      
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-md pointer-events-auto">
          <span className="text-xs text-gray-800">
            {currentPage} / {totalPages - 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
