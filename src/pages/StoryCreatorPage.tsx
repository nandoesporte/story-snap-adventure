
import React, { useEffect } from "react";
import StoryCreator from "../components/StoryCreator";
import { toast } from "sonner";
import { migrateRecentStoryImages } from "@/lib/imageStorage";

const StoryCreatorPage = () => {
  // Iniciar migração de imagens em segundo plano para garantir que não tenhamos links quebrados
  useEffect(() => {
    const migrateImages = async () => {
      try {
        await migrateRecentStoryImages(5);
      } catch (error) {
        console.error("Erro ao migrar imagens:", error);
      }
    };
    
    // Verificar se temos imagens não salvas
    const temporaryImages = localStorage.getItem('temporary_openai_images');
    if (temporaryImages) {
      toast.info("Salvando imagens temporárias em armazenamento permanente...", {
        id: "migrate-images",
        duration: 3000
      });
      migrateImages();
    }
  }, []);

  return <StoryCreator />;
};

export default StoryCreatorPage;
