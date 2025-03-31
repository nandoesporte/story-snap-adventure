
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
      toast.info("Salve a história primeiro para poder compartilhá-la.");
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
        toast.success("Link copiado para a área de transferência!");
      })
      .catch(err => {
        console.error("Erro ao copiar texto:", err);
        toast.error("Não foi possível copiar o link");
      });
  };
  
  return (
    <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between gap-2 z-20">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoHome} 
          className="text-gray-600"
          aria-label="Ir para página inicial"
        >
          <Home className="w-4 h-4" />
          <span className="ml-1 hidden md:inline">Início</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCreateNew} 
          className="text-gray-600"
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
            className="text-gray-600"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm text-gray-500 font-medium">
            {currentPage + 1} / {totalPages}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={currentPage >= totalPages - 1}
            className="text-gray-600"
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
            className="text-gray-600"
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
          className="text-gray-600"
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
          className="text-gray-600"
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
