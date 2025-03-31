
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface StoryNavigationProps {
  currentPage: number;
  totalPages: number;
  isFlipping: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onReset?: () => void;
}

export const StoryNavigation: React.FC<StoryNavigationProps> = ({
  currentPage,
  totalPages,
  isFlipping,
  onPrevious,
  onNext,
  onReset
}) => {
  return (
    <>
      <div className="absolute inset-y-0 left-4 flex items-center z-50">
        {currentPage > 0 && !isFlipping && (
          <Button
            onClick={onPrevious}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center text-gray-800"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-4 flex items-center z-50">
        {currentPage < totalPages - 1 && !isFlipping && (
          <Button
            onClick={onNext}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center text-gray-800"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 font-patrick text-lg text-gray-600 bg-white/80 backdrop-blur-sm py-1 px-4 rounded-full shadow-md">
        Página {currentPage > 0 ? currentPage : 1} de {totalPages}
      </div>
      
      {onReset && (
        <div className="absolute top-6 right-6 z-50 pointer-events-auto">
          <Button
            onClick={onReset}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur-sm"
            title="Recarregar página (em caso de tela branca)"
            aria-label="Recarregar página"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};
