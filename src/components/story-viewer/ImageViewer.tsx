
import React, { useState } from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  open,
  onOpenChange,
  imageUrl,
  zoom,
  onZoomIn,
  onZoomOut
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[92vw] h-[92vh] p-0 bg-black/95 border-violet-300/20">
        <DialogTitle className="sr-only">Visualização da imagem</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            </div>
          )}
          <div 
            className="overflow-auto w-full h-full flex items-center justify-center"
            style={{ transform: `scale(${zoom})` }}
          >
            <img 
              src={imageUrl} 
              alt="Visualização ampliada"
              className="max-w-full max-h-full object-contain transition-transform duration-300"
              onLoad={() => setIsLoading(false)}
              style={{ 
                opacity: isLoading ? 0 : 1, 
                transition: 'opacity 0.3s ease-in-out' 
              }}
            />
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onZoomIn}
              className="bg-white/10 hover:bg-white/20 text-white"
              aria-label="Ampliar imagem"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onZoomOut}
              className="bg-white/10 hover:bg-white/20 text-white"
              aria-label="Diminuir imagem"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
              className="bg-white/10 hover:bg-white/20 text-white"
              aria-label="Fechar visualização"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
