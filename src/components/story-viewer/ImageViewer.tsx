
import React from "react";
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[95vh] p-0 bg-black/95 border-0">
        <DialogTitle className="sr-only">Visualização da imagem</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          <div 
            className="overflow-auto w-full h-full flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <img 
              src={imageUrl} 
              alt="Visualização ampliada"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onZoomIn}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10"
              aria-label="Ampliar imagem"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onZoomOut}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10"
              aria-label="Diminuir imagem"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10"
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
