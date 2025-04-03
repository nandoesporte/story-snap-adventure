
import React, { useEffect } from "react";
import StoryCreator from "../components/StoryCreator";
import { toast } from "sonner";
import { migrateRecentStoryImages } from "@/lib/imageStorage";
import { initializeLocalImageServer } from "@/lib/imageStorage";

const StoryCreatorPage = () => {
  // Initialize local image server and migrate images in background to ensure we don't have broken links
  useEffect(() => {
    const setupImages = async () => {
      try {
        // Initialize local image server to handle images from localStorage/IndexedDB
        initializeLocalImageServer();
        
        // Migrate any existing temporary images
        await migrateRecentStoryImages(5);
      } catch (error) {
        console.error("Erro ao configurar imagens:", error);
      }
    };
    
    // Check if we have images not saved
    const temporaryImages = localStorage.getItem('temporary_openai_images');
    if (temporaryImages) {
      toast.info("Salvando imagens temporárias em armazenamento permanente...", {
        id: "migrate-images",
        duration: 3000
      });
      setupImages();
    } else {
      // Still initialize the image server
      initializeLocalImageServer();
    }
  }, []);

  return <StoryCreator />;
};

export default StoryCreatorPage;
