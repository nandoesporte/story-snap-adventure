
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { migrateRecentStoryImages } from "@/lib/imageStorage";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ImageMigrationButtonProps {
  limit?: number;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | 
            "ghost" | "link" | "storyPrimary" | "storySecondary";
}

const ImageMigrationButton: React.FC<ImageMigrationButtonProps> = ({ 
  limit = 10,
  className = "",
  variant = "storyPrimary"
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMigrateImages = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      toast.info("Iniciando migração de imagens para armazenamento permanente...");
      
      await migrateRecentStoryImages(limit);
      
      toast.success("Migração de imagens concluída com sucesso!");
    } catch (error) {
      console.error("Erro ao migrar imagens:", error);
      toast.error("Ocorreu um erro durante a migração das imagens");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleMigrateImages} 
      disabled={isProcessing}
      variant={variant}
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Migrando imagens...
        </>
      ) : (
        "Salvar imagens no ImgBB"
      )}
    </Button>
  );
};

export default ImageMigrationButton;
