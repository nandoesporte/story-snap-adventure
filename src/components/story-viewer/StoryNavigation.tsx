
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StoryNavigationProps {
  currentPage: number;
  totalPages: number;
  isFlipping: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export const StoryNavigation: React.FC<StoryNavigationProps> = ({
  currentPage,
  totalPages,
  isFlipping,
  onPrevious,
  onNext
}) => {
  return (
    <>
      <div className="absolute inset-y-0 left-2 flex items-center z-50">
        {currentPage > 0 && !isFlipping && (
          <Button
            onClick={onPrevious}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-2 flex items-center z-50">
        {currentPage < totalPages - 1 && !isFlipping && (
          <Button
            onClick={onNext}
            className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-gray-800"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-md pointer-events-auto">
          <span className="text-xs text-gray-800">
            {currentPage} / {totalPages - 1}
          </span>
        </div>
      </div>
    </>
  );
};
