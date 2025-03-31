
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
      <div className="absolute inset-y-0 left-0 flex items-center justify-center w-16 md:w-24 z-50">
        {currentPage > 0 && !isFlipping && (
          <Button
            onClick={onPrevious}
            className="bg-white/90 hover:bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-violet-800"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-16 md:w-24 z-50">
        {currentPage < totalPages - 1 && !isFlipping && (
          <Button
            onClick={onNext}
            className="bg-white/90 hover:bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-violet-800"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {onReset && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={onReset}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white/90"
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
