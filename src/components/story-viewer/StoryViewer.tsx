
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import LoadingSpinner from "../LoadingSpinner";
import { getImageUrl } from "./helpers";
import { useStoryData } from "./useStoryData"; // Fixed import
import { ViewerControls } from "./ViewerControls";
import { CoverPage } from "./CoverPage";
import { StoryPage } from "./StoryPage";
import { ImageViewer } from "./ImageViewer";

const StoryViewer: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { 
    storyData, 
    loading, 
    totalPages, 
    handleImageError 
  } = useStoryData(id);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [imageZoom, setImageZoom] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [hideText, setHideText] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  
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
    // Set rendered state after component mounts
    setIsRendered(true);
  }, []);
  
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
            storyId={id}
            title={storyData?.title || ""}
            currentPage={currentPage}
            totalPages={totalPages}
            isDownloading={isDownloading}
            isMobile={isMobile}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
            onDownloadPDF={handleDownloadPDF}
          />
          
          <div className="flex-1 relative overflow-hidden" style={{ height: 'calc(100% - 57px)' }}>
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
                      onImageError={handleImageError}
                    />
                  ) : (
                    <StoryPage
                      storyId={id}
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
                      isFullscreen={false}
                      isMobile={isMobile}
                      hideText={hideText}
                      voiceType={storyData.voiceType || 'female'}
                      onImageClick={handleImageClick}
                      onImageError={() => handleImageError(
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
    </div>
  );
};

export default StoryViewer;
