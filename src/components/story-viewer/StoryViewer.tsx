
import React, { useRef, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Volume2, Moon, Sun, Maximize, Minimize, RefreshCw } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner";
import { useStoryData } from "./useStoryData";
import { ViewerControls } from "./ViewerControls";
import { ImageViewer } from "./ImageViewer";
import { PageTransition } from "./PageTransition";
import { StoryNavigation } from "./StoryNavigation";
import { useStoryNavigation } from "@/hooks/useStoryNavigation";
import { usePDFGenerator } from "@/hooks/usePDFGenerator";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useImageViewer } from "@/hooks/useImageViewer";
import { useStoryNarration } from "@/hooks/useStoryNarration";
import { toast } from "sonner";

interface StoryViewerProps {
  storyId?: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ storyId }) => {
  const { 
    storyData, 
    loading, 
    handleImageError,
    error,
    retryLoading
  } = useStoryData(storyId);
  
  const { id } = useParams<{ id?: string }>();
  const effectiveStoryId = storyId || id;
  const navigate = useNavigate();
  
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isContentReady, setIsContentReady] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  
  // Custom hooks
  const {
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
  } = useStoryNavigation(storyData, isMobile);
  
  const {
    isFullscreen,
    isTransitioning,
    toggleFullscreen
  } = useFullscreen();
  
  const {
    isDownloading,
    generatePDF
  } = usePDFGenerator();
  
  const {
    showImageViewer,
    setShowImageViewer,
    currentImageUrl,
    imageZoom,
    handleImageClick,
    handleZoomIn,
    handleZoomOut
  } = useImageViewer();

  // Debug info
  const [debugMode, setDebugMode] = useState(false);
  const toggleDebugMode = () => setDebugMode(!debugMode);

  // Get current page text for narration
  const currentPageText = storyData && currentPage > 0 && storyData.pages[currentPage - 1] 
    ? storyData.pages[currentPage - 1].text 
    : "";

  // Narration setup
  const { 
    isPlaying, 
    playAudio, 
    isGenerating 
  } = useStoryNarration({
    storyId: effectiveStoryId || "",
    text: currentPageText,
    pageIndex: currentPage - 1,
    voiceType: storyData?.voiceType || 'female'
  });

  // Toggle night reading mode
  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
    if (bookRef.current) {
      if (!isNightMode) {
        bookRef.current.classList.add('night-mode');
      } else {
        bookRef.current.classList.remove('night-mode');
      }
    }
    toast.info(isNightMode ? "Modo de leitura diurno ativado" : "Modo de leitura noturno ativado");
  };

  // Make sure content is ready after loading
  useEffect(() => {
    if (!loading && storyData) {
      // Add a small delay to ensure all components are ready
      const timer = setTimeout(() => {
        setIsContentReady(true);
        console.log("Story content is ready to display");
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [loading, storyData]);

  // Log story data received for debugging
  useEffect(() => {
    if (storyData) {
      console.log("Story data received in StoryViewer:", {
        hasTitle: !!storyData.title,
        hasPages: storyData.pages.length,
        firstPageText: storyData.pages[0]?.text?.substring(0, 30) + "...",
        coverImage: storyData.coverImageUrl || storyData.cover_image_url
      });
    } else if (!loading) {
      console.log("No story data available after loading completed");
    }
  }, [storyData, loading]);

  // Effect to maintain correct visual state when toggling fullscreen
  useEffect(() => {
    preserveFullscreenState(isFullscreen);
  }, [isFullscreen, preserveFullscreenState]);
  
  // Handler for white screen issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && storyData) {
        // Document became visible again, check if update is needed
        console.log("Document became visible again, checking if update is needed");
        setTimeout(() => {
          forcePageReset();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add listener for image loading errors
    const handleUnhandledErrors = (event: ErrorEvent) => {
      if (event.message.includes('loading chunk') || 
          event.message.includes('loading CSS chunk') ||
          event.message.includes('Failed to load resource')) {
        console.error("Loading error detected:", event.message);
        forcePageReset();
      }
    };
    
    window.addEventListener('error', handleUnhandledErrors);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleUnhandledErrors);
    };
  }, [storyData, forcePageReset]);
  
  // Prepare data for child components
  const storyDataWithTypedText = storyData ? {
    ...storyData,
    typedText
  } : null;
  
  const handleDownloadPDF = () => {
    generatePDF(bookRef, storyData, setCurrentPage);
  };
  
  const handleToggleFullscreen = () => {
    toggleFullscreen(storyContainerRef);
  };

  const handlePlayNarration = () => {
    playAudio();
    toast.info(isPlaying ? "Narração pausada" : "Iniciando narração...");
  };
  
  const handleResetPage = () => {
    toast.info("Recarregando história...");
    retryLoading();
  };

  // Handle error cases
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 p-8 text-center">
        <p className="text-red-500 text-lg font-medium">Erro ao carregar a história</p>
        <p className="text-gray-500 max-w-md mx-auto mb-4">
          Não foi possível carregar os dados da história. Isto pode acontecer se a história não foi salva corretamente 
          ou se houve um problema de conexão.
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <Button 
            onClick={handleResetPage}
            variant="default"
            size="lg"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Tentar novamente
          </Button>
          
          <Button 
            onClick={() => navigate("/create-story")}
            variant="outline"
            size="lg"
          >
            Criar nova história
          </Button>
          
          {debugMode && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-left max-w-xl mx-auto overflow-auto text-xs">
              <p className="font-bold">Detalhes do erro:</p>
              <pre className="whitespace-pre-wrap">{error.message}</pre>
              
              <p className="font-bold mt-2">Session Storage:</p>
              <pre className="whitespace-pre-wrap">
                {(() => {
                  try {
                    const data = sessionStorage.getItem("storyData");
                    return data ? `Dados existem (${data.length} caracteres)` : "Nenhum dado encontrado";
                  } catch (e) {
                    return "Erro ao acessar sessionStorage";
                  }
                })()}
              </pre>
            </div>
          )}
        </div>
        <button 
          onClick={toggleDebugMode} 
          className="text-xs text-gray-400 mt-4 hover:text-gray-600"
        >
          {debugMode ? "Ocultar detalhes técnicos" : "Mostrar detalhes técnicos"}
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full ${isNightMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col overflow-hidden transition-colors duration-300`}
      ref={storyContainerRef}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <LoadingSpinner />
          <p className="text-gray-500 animate-pulse">Carregando sua história...</p>
        </div>
      ) : (
        <div 
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
            onToggleFullscreen={handleToggleFullscreen}
          />
          
          <div className={`flex-1 relative overflow-hidden ${isTransitioning ? 'opacity-95' : ''}`} ref={bookRef}>
            {isContentReady && storyData && (
              <PageTransition
                storyId={effectiveStoryId}
                storyData={storyDataWithTypedText}
                currentPage={currentPage}
                isFlipping={isFlipping}
                flipDirection={flipDirection}
                isRendered={isRendered}
                isFullscreen={isFullscreen}
                isMobile={isMobile}
                hideText={hideText}
                onImageClick={handleImageClick}
                onImageError={handleImageError}
                onToggleTextVisibility={toggleTextVisibility}
              />
            )}
            
            <StoryNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              isFlipping={isFlipping}
              onPrevious={handlePreviousPage}
              onNext={handleNextPage}
              onReset={handleResetPage}
            />

            {/* Floating Action Buttons */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-50">
              {/* Narration Button */}
              <Button
                onClick={handlePlayNarration}
                disabled={isGenerating || currentPage === 0}
                className={`rounded-full w-12 h-12 flex items-center justify-center shadow-lg ${
                  isPlaying ? 'bg-violet-600 text-white' : 'bg-white/80 text-gray-800'
                } backdrop-blur-sm hover:bg-violet-500 hover:text-white transition-all`}
                title={isPlaying ? "Pausar narração" : "Ouvir narração"}
              >
                <Volume2 className={`h-5 w-5 ${isGenerating ? 'animate-pulse' : ''}`} />
              </Button>

              {/* Night Mode Toggle */}
              <Button
                onClick={toggleNightMode}
                className={`rounded-full w-12 h-12 flex items-center justify-center shadow-lg ${
                  isNightMode ? 'bg-yellow-400 text-gray-800' : 'bg-indigo-900 text-white'
                } backdrop-blur-sm hover:bg-opacity-90 transition-all`}
                title={isNightMode ? "Modo dia" : "Modo noite"}
              >
                {isNightMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                onClick={handleToggleFullscreen}
                className="rounded-full w-12 h-12 flex items-center justify-center shadow-lg bg-white/80 text-gray-800 backdrop-blur-sm hover:bg-white transition-all"
                title={isFullscreen ? "Sair de tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
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
