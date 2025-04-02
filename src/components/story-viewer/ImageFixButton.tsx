
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImageOff, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useImageUrlChecker } from "@/hooks/useImageUrlChecker";

interface ImageFixButtonProps {
  storyId: string;
  imageUrls: string[];
  onImagesFixed?: (fixedUrls: Record<string, string>) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | 
            "ghost" | "link" | "storyPrimary" | "storySecondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const ImageFixButton: React.FC<ImageFixButtonProps> = ({
  storyId,
  imageUrls,
  onImagesFixed,
  variant = "outline",
  size = "sm",
  className = ""
}) => {
  const [showResults, setShowResults] = useState(false);
  
  const { isChecking, results, checkUrls } = useImageUrlChecker({
    onComplete: (results) => {
      if (results.fixed > 0) {
        if (onImagesFixed) {
          onImagesFixed(results.fixedUrls);
        }
        setShowResults(true);
        setTimeout(() => setShowResults(false), 5000);
      }
    }
  });
  
  const handleCheckImages = () => {
    if (imageUrls.length === 0) {
      toast.warning("Não há imagens para verificar nesta história");
      return;
    }
    
    toast.info("Verificando imagens da história...");
    checkUrls(imageUrls);
  };
  
  return (
    <div className="space-y-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleCheckImages}
        disabled={isChecking}
        className={className}
      >
        {isChecking ? (
          <>
            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            <span className="text-xs">Verificando...</span>
          </>
        ) : (
          <>
            <ImageOff className="h-4 w-4 mr-1" />
            <span className="text-xs">Verificar imagens</span>
          </>
        )}
      </Button>
      
      {showResults && results.fixed > 0 && (
        <div className="text-xs flex items-center text-green-600 mt-1 bg-green-50 px-2 py-1 rounded">
          <CheckCircle className="h-3 w-3 mr-1" />
          <span>{results.fixed} imagens corrigidas</span>
        </div>
      )}
    </div>
  );
};

export default ImageFixButton;
