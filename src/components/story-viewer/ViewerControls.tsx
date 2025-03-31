
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
import { toast } from "sonner";

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
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div className="bg-white border-b border-gray-100 p-3 flex items-center justify-between gap-2 z-20 shadow-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoHome} 
          className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
          aria-label="Ir para página inicial"
        >
          <Home className="w-4 h-4" />
          <span className="ml-1 hidden md:inline">Início</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCreateNew} 
          className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
          aria-label="Criar nova história"
        >
          <BookText className="w-4 h-4" />
          <span className="ml-1 hidden md:inline">Nova História</span>
        </Button>
      </div>
      
      <div className="flex-1 flex justify-center items-center">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={currentPage <= 0}
            className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm text-violet-800 font-medium">
            {currentPage + 1} / {totalPages}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={currentPage >= totalPages - 1}
            className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="ml-1 hidden md:inline">
              {isFullscreen ? "Sair" : "Tela Cheia"}
            </span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShareStory}
          className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
          aria-label="Compartilhar história"
        >
          <Share className="w-4 h-4" />
          <span className="ml-1 hidden md:inline">Compartilhar</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownloadPDF}
          disabled={isDownloading}
          className="text-violet-700 hover:text-violet-800 hover:bg-violet-50"
          aria-label="Baixar PDF"
        >
          <Download className="w-4 h-4" />
          <span className="ml-1 hidden md:inline">
            {isDownloading ? "Processando..." : "Download"}
          </span>
        </Button>
      </div>
    </div>
  );
};
