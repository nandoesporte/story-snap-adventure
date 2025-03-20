
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { 
  DownloadIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  BookOpenIcon, 
  Share2Icon, 
  VolumeIcon, 
  BookmarkIcon,
  HeartIcon
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

// Define the story data structure
interface StoryData {
  title: string;
  coverImageUrl: string;
  childImage: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  pages: Array<{
    text: string;
    imageUrl: string;
  }>;
}

const StoryViewer = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const storyBookRef = useRef<HTMLDivElement>(null);
  
  // Load story data from session storage on component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("storyData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setStoryData(parsedData);
    }
  }, []);
  
  // Function to navigate to the previous page
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Function to navigate to the next page
  const nextPage = () => {
    const maxPages = storyData ? storyData.pages.length : 0;
    if (currentPage < maxPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Function to toggle audio narration
  const toggleAudio = () => {
    setIsAudioPlaying(!isAudioPlaying);
    if (!isAudioPlaying) {
      toast.info("Narração de áudio iniciada");
    } else {
      toast.info("Narração de áudio pausada");
    }
  };
  
  // Function to share the story
  const shareStory = () => {
    if (navigator.share && storyData) {
      navigator.share({
        title: storyData.title,
        text: `Confira esta história incrível: ${storyData.title}`,
        url: window.location.href,
      })
      .then(() => toast.success("História compartilhada com sucesso!"))
      .catch((error) => {
        console.error("Erro ao compartilhar:", error);
        toast.error("Não foi possível compartilhar a história");
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Link copiado para a área de transferência!"))
        .catch(() => toast.error("Não foi possível copiar o link"));
    }
  };
  
  // Function to generate a PDF of the storybook
  const generatePdf = async () => {
    if (!storyData) return;
    
    setIsPdfGenerating(true);
    toast.info("Gerando PDF, por favor aguarde...");
    
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Use html2canvas to capture the current view as an image
      if (storyBookRef.current) {
        const canvas = await html2canvas(storyBookRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true
        });
        
        const pngData = canvas.toDataURL('image/png');
        const pngImage = await pdfDoc.embedPng(pngData);
        
        // Add a page to the PDF
        const page = pdfDoc.addPage([800, 600]);
        
        // Draw the PNG image to fill the page
        const { width, height } = pngImage.size();
        const aspectRatio = width / height;
        
        let drawWidth = page.getWidth() - 50;
        let drawHeight = drawWidth / aspectRatio;
        
        if (drawHeight > page.getHeight() - 50) {
          drawHeight = page.getHeight() - 50;
          drawWidth = drawHeight * aspectRatio;
        }
        
        page.drawImage(pngImage, {
          x: (page.getWidth() - drawWidth) / 2,
          y: (page.getHeight() - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight
        });
      }
      
      // Get more pages
      for (let i = 0; i < storyData.pages.length; i++) {
        if (i !== currentPage) {
          setCurrentPage(i);
          // Wait for the UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (storyBookRef.current) {
            const canvas = await html2canvas(storyBookRef.current, {
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true
            });
            
            const pngData = canvas.toDataURL('image/png');
            const pngImage = await pdfDoc.embedPng(pngData);
            
            // Add a page to the PDF
            const page = pdfDoc.addPage([800, 600]);
            
            // Draw the PNG image to fill the page
            const { width, height } = pngImage.size();
            const aspectRatio = width / height;
            
            let drawWidth = page.getWidth() - 50;
            let drawHeight = drawWidth / aspectRatio;
            
            if (drawHeight > page.getHeight() - 50) {
              drawHeight = page.getHeight() - 50;
              drawWidth = drawHeight * aspectRatio;
            }
            
            page.drawImage(pngImage, {
              x: (page.getWidth() - drawWidth) / 2,
              y: (page.getHeight() - drawHeight) / 2,
              width: drawWidth,
              height: drawHeight
            });
          }
        }
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storyData.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  // If no story data is available, show a message
  if (!storyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-16 w-16 text-purple-300 mb-4" />
          <h3 className="text-xl font-semibold text-purple-700">Nenhuma história encontrada</h3>
          <p className="mt-2 text-gray-500">Crie uma história primeiro para visualizá-la aqui.</p>
        </div>
      </div>
    );
  }
  
  // Current page data
  const pageData = storyData.pages[currentPage];
  
  return (
    <div ref={storyBookRef} className="story-viewer-container">
      {/* Story header with title and actions */}
      <div className="story-header">
        <div className="story-avatar">
          <img 
            src={storyData.coverImageUrl || '/placeholder.svg'} 
            alt={storyData.title}
            className="rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        <h1 className="story-title">{storyData.title}</h1>
        
        <div className="story-actions">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={shareStory}
            className="story-action-btn"
            title="Compartilhar"
          >
            <Share2Icon className="h-5 w-5 text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleAudio}
            className={`story-action-btn ${isAudioPlaying ? "bg-white/20" : ""}`}
            title={isAudioPlaying ? "Pausar narração" : "Iniciar narração"}
          >
            <VolumeIcon className="h-5 w-5 text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="story-action-btn"
            title="Favoritar história"
          >
            <HeartIcon className="h-5 w-5 text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={generatePdf}
            disabled={isPdfGenerating}
            className="story-action-btn"
            title="Baixar PDF"
          >
            {isPdfGenerating ? (
              <LoadingSpinner size="sm" />
            ) : (
              <DownloadIcon className="h-5 w-5 text-white" />
            )}
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className="ml-2 bg-white text-purple-700 hover:bg-white/90 hidden sm:flex"
          >
            <BookmarkIcon className="h-4 w-4 mr-1" />
            Comprar versão impressa
          </Button>
        </div>
      </div>
      
      {/* Main story content */}
      <div className="story-content-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="story-page"
          >
            <div className="story-page-inner">
              <div className="story-image-container">
                <img 
                  src={pageData.imageUrl}
                  alt={`Ilustração página ${currentPage + 1}`}
                  className="story-image"
                />
                
                {/* Progress bar */}
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-filled" 
                      style={{ width: `${((currentPage + 1) / storyData.pages.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {currentPage + 1} / {storyData.pages.length}
                  </span>
                </div>
              </div>
              
              <div className="story-text-container">
                <p className="story-text">{pageData.text}</p>
                
                <div className="page-navigation">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="nav-button"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage === storyData.pages.length - 1}
                    className="nav-button"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Story metadata and author info */}
      <div className="story-metadata">
        <div className="metadata-section">
          <h3 className="metadata-title">Sobre a história</h3>
          <p className="metadata-content">
            Esta história foi criada especialmente para {storyData.childName}, {storyData.childAge} anos.
            Tema: {storyData.theme}. Cenário: {storyData.setting}.
          </p>
        </div>
        
        <div className="metadata-section">
          <h3 className="metadata-title">Sobre o autor</h3>
          <div className="author-info">
            <div className="author-avatar">
              <img src="/placeholder.svg" alt="Avatar do autor" className="rounded-full" />
            </div>
            <div className="author-details">
              <p className="author-name">StoryBot AI</p>
              <p className="author-bio">Histórias personalizadas criadas com inteligência artificial.</p>
            </div>
          </div>
        </div>
        
        <div className="metadata-section">
          <h3 className="metadata-title">Direitos autorais</h3>
          <p className="metadata-content">
            © {new Date().getFullYear()} StorySpark. Todos os direitos reservados.
            Esta história é de uso pessoal e não deve ser redistribuída sem autorização.
          </p>
        </div>
      </div>
      
      {/* Mobile action button for PDF download */}
      <div className="mobile-action-button sm:hidden">
        <Button
          className="w-full"
          onClick={generatePdf}
          disabled={isPdfGenerating}
        >
          {isPdfGenerating ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Gerando PDF...</span>
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4 mr-2" />
              <span>Baixar PDF</span>
            </>
          )}
        </Button>
      </div>
      
      {/* CSS for the story viewer */}
      <style>
        {`
        .story-viewer-container {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          margin-bottom: 2rem;
        }
        
        .story-header {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          background-color: rgba(124, 58, 237, 0.9);
          position: relative;
          flex-wrap: wrap;
        }
        
        .story-avatar {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
          margin-right: 1rem;
          position: relative;
          z-index: 5;
        }
        
        .story-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .story-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Bubblegum Sans', cursive;
          margin: 0;
          flex: 1;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .story-actions {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
          width: 100%;
        }
        
        @media (min-width: 640px) {
          .story-actions {
            width: auto;
            margin-top: 0;
          }
        }
        
        .story-action-btn {
          margin-right: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .story-content-container {
          position: relative;
          flex: 1;
        }
        
        .story-page {
          width: 100%;
        }
        
        .story-page-inner {
          display: flex;
          flex-direction: column;
        }
        
        @media (min-width: 768px) {
          .story-page-inner {
            flex-direction: row;
            min-height: 500px;
          }
        }
        
        .story-image-container {
          flex: 1;
          position: relative;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f9f7ff;
        }
        
        .story-image {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .story-text-container {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          background: linear-gradient(to bottom, #ffffff, #f9f7ff);
          position: relative;
        }
        
        .story-text {
          font-family: 'Patrick Hand', cursive;
          font-size: 1.25rem;
          line-height: 1.6;
          color: #4b5563;
          flex: 1;
          margin-bottom: 4rem;
        }
        
        .page-navigation {
          display: flex;
          justify-content: space-between;
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          right: 1.5rem;
        }
        
        .nav-button {
          background-color: white;
          border-color: #e5e7eb;
          color: #6b7280;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .nav-button:hover:not(:disabled) {
          background-color: #f9fafb;
        }
        
        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .progress-bar-container {
          display: flex;
          align-items: center;
          margin-top: 1rem;
          width: 100%;
        }
        
        .progress-bar {
          flex: 1;
          height: 6px;
          background-color: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-right: 1rem;
        }
        
        .progress-bar-filled {
          height: 100%;
          background-color: #8b5cf6;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }
        
        .story-metadata {
          padding: 1.5rem;
          background-color: #f9f7ff;
          border-top: 1px solid #e5e7eb;
        }
        
        .metadata-section {
          margin-bottom: 1.5rem;
        }
        
        .metadata-section:last-child {
          margin-bottom: 0;
        }
        
        .metadata-title {
          font-family: 'Bubblegum Sans', cursive;
          font-size: 1.125rem;
          color: #4b5563;
          margin-bottom: 0.5rem;
        }
        
        .metadata-content {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.5;
        }
        
        .author-info {
          display: flex;
          align-items: center;
        }
        
        .author-avatar {
          width: 40px;
          height: 40px;
          margin-right: 1rem;
        }
        
        .author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .author-details {
          flex: 1;
        }
        
        .author-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0 0 0.25rem 0;
        }
        
        .author-bio {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0;
        }
        
        .mobile-action-button {
          padding: 1rem;
          background-color: white;
          border-top: 1px solid #e5e7eb;
          position: sticky;
          bottom: 0;
        }
        
        /* Additional styling for mobile optimization */
        @media (max-width: 640px) {
          .story-header {
            padding: 1rem;
          }
          
          .story-avatar {
            width: 40px;
            height: 40px;
          }
          
          .story-title {
            font-size: 1.25rem;
          }
          
          .story-text {
            font-size: 1.125rem;
          }
          
          .story-image-container, .story-text-container {
            padding: 1rem;
          }
          
          .page-navigation {
            left: 1rem;
            right: 1rem;
            bottom: 1rem;
          }
        }
        `}
      </style>
    </div>
  );
};

export default StoryViewer;
