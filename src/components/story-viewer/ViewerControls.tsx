
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Home, 
  BookText, 
  Share, 
  Maximize, 
  Minimize
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ViewerControlsProps {
  storyId: string | undefined;
  title: string;
  currentPage: number;
  totalPages: number;
  isDownloading: boolean;
  isFullscreen: boolean;
  isMobile: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onDownloadPDF: () => void;
  onToggleFullscreen: () => void;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  storyId,
  title,
  currentPage,
  totalPages,
  isDownloading,
  isFullscreen,
  isMobile,
  onPrevious,
  onNext,
  onDownloadPDF,
  onToggleFullscreen
}) => {
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate("/");
  };
  
  const handleCreateNew = () => {
    navigate("/create-story");
  };
  
  const handleShareStory = () => {
    if (!storyId) {
      console.info("Salve a história primeiro para poder compartilhá-la.");
      return;
    }
    
    const shareUrl = `${window.location.origin}/view-story/${storyId}`;
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Confira esta história incrível: ${title}`,
        url: shareUrl
      }).catch(err => {
        console.error("Erro ao compartilhar:", err);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log("Link copiado para a área de transferência!");
      })
      .catch(err => {
        console.error("Erro ao copiar texto:", err);
      });
  };
  
  return (
    <div className="bg-white border-b border-amber-200/50 px-4 py-3 flex items-center justify-between gap-2 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoHome} 
          className="text-amber-800 hover:bg-amber-100"
          aria-label="Ir para página inicial"
        >
          <Home className="w-4 h-4" />
          <span className="ml-2 hidden md:inline font-medium">Início</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCreateNew} 
          className="text-amber-800 hover:bg-amber-100"
          aria-label="Criar nova história"
        >
          <BookText className="w-4 h-4" />
          <span className="ml-2 hidden md:inline font-medium">Nova História</span>
        </Button>
      </div>
      
      <div className="flex-1 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentPage <= 0}
            className="text-amber-800 border-amber-200 hover:bg-amber-100"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium px-3 py-1 bg-amber-100/70 rounded-full text-amber-800 min-w-[4rem] text-center">
            {currentPage + 1} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentPage >= totalPages - 1}
            className="text-amber-800 border-amber-200 hover:bg-amber-100"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="text-amber-800 hover:bg-amber-100"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="ml-2 hidden md:inline font-medium">
              {isFullscreen ? "Sair" : "Tela Cheia"}
            </span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShareStory}
          className="text-amber-800 hover:bg-amber-100"
          aria-label="Compartilhar história"
        >
          <Share className="w-4 h-4" />
          <span className="ml-2 hidden md:inline font-medium">Compartilhar</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          className="bg-amber-400/90 hover:bg-amber-500 text-black border-none"
          aria-label="Baixar PDF"
        >
          <Download className="w-4 h-4 mr-2" />
          <span>
            {isDownloading ? "Processando..." : "Baixar PDF"}
          </span>
        </Button>
      </div>
    </div>
  );
};
