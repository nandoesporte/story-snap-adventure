
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
    <>
      <div className="bg-white border-b border-gray-200 p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGoHome} 
            className="text-gray-600"
          >
            <Home className="w-4 h-4" />
            <span className="ml-1 hidden md:inline">Início</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCreateNew} 
            className="text-gray-600"
          >
            <BookText className="w-4 h-4" />
            <span className="ml-1 hidden md:inline">Nova História</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFullscreen}
              className="text-gray-600"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span className="ml-1 hidden md:inline">
                {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              </span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareStory}
            className="text-gray-600"
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
          >
            <Download className="w-4 h-4" />
            <span className="ml-1 hidden md:inline">
              {isDownloading ? "Processando..." : "Download PDF"}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="absolute inset-y-0 left-2 flex items-center z-10">
        {currentPage > 0 && (
          <Button
            variant="outline"
            size="icon"
            onClick={onPrevious}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-2 flex items-center z-10">
        {currentPage < totalPages - 1 && (
          <Button
            variant="outline"
            size="icon"
            onClick={onNext}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      {!isFullscreen && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-md pointer-events-auto">
            <span className="text-xs text-gray-800">
              {currentPage} / {totalPages - 1}
            </span>
          </div>
        </div>
      )}
    </>
  );
};
