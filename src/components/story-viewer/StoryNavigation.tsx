
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
            className="bg-amber-400/90 hover:bg-amber-500 text-black shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
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
            className="bg-amber-400/90 hover:bg-amber-500 text-black shadow-lg rounded-full w-12 h-12 flex items-center justify-center"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
      
      {onReset && (
        <div className="absolute top-6 right-6 z-50 pointer-events-auto">
          <Button
            onClick={onReset}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-1 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800"
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
