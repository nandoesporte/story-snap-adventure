import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
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
  HeartIcon,
  Settings
} from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import LeonardoWebhookConfig from "./LeonardoWebhookConfig";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface StoryData {
  title: string;
  coverImageUrl: string;
  childImage: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterId?: string;
  characterName?: string;
  style?: string; 
  readingLevel?: string;
  language?: string;
  moral?: string;
  pages: Array<{
    text: string;
    imageUrl: string;
  }>;
}

const StoryViewer = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [pageDirection, setPageDirection] = useState<"left" | "right">("right");
  const storyBookRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem("storyData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setStoryData(parsedData);
    }
  }, []);

  const prevPage = () => {
    if (currentPage > -1) {
      setPageDirection("left");
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    const maxPages = storyData ? storyData.pages.length - 1 : -1;
    if (currentPage < maxPages) {
      setPageDirection("right");
      setCurrentPage(currentPage + 1);
    }
  };

  const toggleAudio = () => {
    setIsAudioPlaying(!isAudioPlaying);
    if (!isAudioPlaying) {
      if (storyData && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          currentPage === -1 
            ? `${storyData.title}. Uma história para ${storyData.childName}.` 
            : storyData.pages[currentPage]?.text || ""
        );
        utterance.lang = storyData.language === 'english' ? 'en-US' : 'pt-BR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
      toast.info("Narração de áudio iniciada");
    } else {
      window.speechSynthesis?.cancel();
      toast.info("Narração de áudio pausada");
    }
  };

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
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Link copiado para a área de transferência!"))
        .catch(() => toast.error("Não foi possível copiar o link"));
    }
  };

  const generatePdf = async () => {
    if (!storyData) return;
    
    setIsPdfGenerating(true);
    toast.info("Gerando PDF, por favor aguarde...");
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      const originalPage = currentPage;
      setCurrentPage(-1);
      
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
        
        const coverPage = pdfDoc.addPage([800, 600]);
        
        const { width, height } = pngImage.size();
        const aspectRatio = width / height;
        
        let drawWidth = coverPage.getWidth() - 50;
        let drawHeight = drawWidth / aspectRatio;
        
        if (drawHeight > coverPage.getHeight() - 50) {
          drawHeight = coverPage.getHeight() - 50;
          drawWidth = drawHeight * aspectRatio;
        }
        
        coverPage.drawImage(pngImage, {
          x: (coverPage.getWidth() - drawWidth) / 2,
          y: (coverPage.getHeight() - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight
        });
      }
      
      for (let i = 0; i < storyData.pages.length; i++) {
        setCurrentPage(i);
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
          
          const page = pdfDoc.addPage([800, 600]);
          
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
      
      setCurrentPage(originalPage);
      
      const pdfBytes = await pdfDoc.save();
      
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

  const isCoverPage = currentPage === -1;
  const pageData = isCoverPage ? null : storyData.pages[currentPage];

  const pageVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 1000 : -1000,
      opacity: 0,
      rotateY: direction === "right" ? -15 : 15,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -1000 : 1000,
      opacity: 0,
      rotateY: direction === "right" ? 15 : -15,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <div ref={storyBookRef} className="story-viewer-container story-book-style">
      <div className="story-header">
        <div className="story-avatar">
          <img 
            src={storyData?.coverImageUrl || '/placeholder.svg'} 
            alt={storyData?.title}
            className="rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        <h1 className="story-title">{storyData?.title}</h1>
        
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="story-action-btn"
                title="Configurações"
              >
                <Settings className="h-5 w-5 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <LeonardoWebhookConfig />
            </DialogContent>
          </Dialog>
          
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
      
      <div className="story-content-container">
        <AnimatePresence mode="wait" custom={pageDirection}>
          <motion.div
            key={currentPage}
            custom={pageDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="story-page"
          >
            <div className="story-page-inner">
              {isCoverPage ? (
                <div className="story-cover">
                  <div className="story-cover-image-container">
                    <img 
                      src={storyData?.coverImageUrl}
                      alt={`Capa: ${storyData?.title}`}
                      className="story-cover-image"
                    />
                  </div>
                  <div className="story-cover-details">
                    <h2 className="story-cover-title">{storyData?.title}</h2>
                    <div className="story-cover-subtitle">
                      {storyData?.characterName ? (
                        <p>Uma aventura com {storyData?.characterName}</p>
                      ) : (
                        <p>Uma história para {storyData?.childName}</p>
                      )}
                    </div>
                    <div className="story-cover-decoration">
                      <div className="story-cover-line"></div>
                      <BookOpenIcon className="h-8 w-8 text-purple-500 mx-4" />
                      <div className="story-cover-line"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="story-image-container">
                    <img 
                      src={pageData?.imageUrl}
                      alt={`Ilustração página ${currentPage + 1}`}
                      className="story-image"
                    />
                    
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
                    <p className="story-text">{pageData?.text}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="page-corner page-corner-right" onClick={nextPage}></div>
        <div className="page-corner page-corner-left" onClick={prevPage}></div>
      </div>
      
      <div className="page-navigation">
        <Button
          variant="outline"
          size="icon"
          onClick={prevPage}
          disabled={currentPage === -1}
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
      
      <div className="story-metadata">
        <div className="metadata-section">
          <h3 className="metadata-title">Sobre a história</h3>
          <p className="metadata-content">
            Esta história foi criada especialmente {storyData?.characterName ? 
            `com o personagem ${storyData?.characterName}` : 
            `para ${storyData?.childName}, ${storyData?.childAge} anos`}.
            Tema: {storyData?.theme}. Cenário: {storyData?.setting}.
            {storyData?.moral && ` Moral: ${storyData?.moral}.`}
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
          position: relative;
        }
        
        .story-book-style {
          background: #f8f5f0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 
                      0 0 5px rgba(0, 0, 0, 0.1), 
                      0 -5px 10px rgba(0, 0, 0, 0.1) inset;
          border-radius: 0.5rem;
          padding: 0.5rem;
        }
        
        .story-header {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          background-color: rgba(124, 58, 237, 0.9);
          position: relative;
          flex-wrap: wrap;
          border-radius: 0.5rem 0.5rem 0 0;
          background-image: linear-gradient(to right, #8b5cf6, #6366f1);
          border-bottom: 4px solid #7c3aed;
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
          min-height: 500px;
          background: #fff;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          overflow: hidden;
          perspective: 1500px;
        }
        
        .story-page {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
        }
        
        .story-page-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        @media (min-width: 768px) {
          .story-page-inner {
            flex-direction: row;
            min-height: 500px;
          }
        }
        
        .story-cover {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 2rem;
          background: linear-gradient(135deg, #f5f3ff, #ede9fe);
          position: relative;
        }
        
        .story-cover::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23a78bfa' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 0.5;
          pointer-events: none;
        }
        
        .story-cover-image-container {
          width: 100%;
          max-width: 350px;
          margin-bottom: 2rem;
          position: relative;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 5px 10px rgba(0, 0, 0, 0.1);
        }
        
        .story-cover-image-container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }
        
        .story-cover-image {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }
        
        .story-cover-details {
          text-align: center;
          max-width: 500px;
        }
        
        .story-cover-title {
          font-family: 'Bubblegum Sans', cursive;
          font-size: 2.5rem;
          color: #7c3aed;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 0px rgba(255,255,255,0.5);
        }
        
        .story-cover-subtitle {
          font-family: 'Patrick Hand', cursive;
          font-size: 1.25rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
        }
        
        .story-cover-decoration {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2rem;
        }
        
        .story-cover-line {
          height: 2px;
          flex: 1;
          background: linear-gradient(to right, rgba(167, 139, 250, 0), rgba(167, 139, 250, 0.5), rgba(167, 139, 250, 0));
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
          border-right: 1px solid #e5e7eb;
        }
        
        .story-image {
          max-width: 100%;
          max-height: 400px;
          object-fit: contain;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border: 4px solid white;
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
        }
        
        .page-navigation {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background-color: #f9f7ff;
          border-top: 1px solid #e5e7eb;
          border-radius: 0 0 0.5rem 0.5rem;
          z-index: 10;
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
        
        .page-corner {
          position: absolute;
          width: 50px;
          height: 50px;
          z-index: 10;
          cursor: pointer;
        }
        
        .page-corner-right {
          bottom: 0;
          right: 0;
          background: linear-gradient(135deg, transparent 50%, rgba(139, 92, 246, 0.1) 50%);
        }
        
        .page-corner-right:hover {
          background: linear-gradient(135deg, transparent 50%, rgba(139, 92, 246, 0.2) 50%);
        }
        
        .page-corner-left {
          bottom: 0;
          left: 0;
          background: linear-gradient(225deg, transparent 50%, rgba(139, 92, 246, 0.1) 50%);
        }
        
        .page-corner-left:hover {
          background: linear-gradient(225deg, transparent 50%, rgba(139, 92, 246, 0.2) 50%);
        }
        
        .story-metadata {
          padding: 1.5rem;
          background-color: #f9f7ff;
          border-top: 1px solid #e5e7eb;
          margin-top: auto;
          border-radius: 0 0 0.5rem 0.5rem;
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
          
          .story-cover-title {
            font-size: 1.75rem;
          }
          
          .story-cover-subtitle {
            font-size: 1rem;
          }
          
          .page-navigation {
            padding: 0.75rem;
          }
        }
        `}
      </style>
    </div>
  );
};

export default StoryViewer;
