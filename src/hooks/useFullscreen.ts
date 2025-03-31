
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Small delay to allow UI to adjust
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Increased from 300ms to 500ms for smoother transitions
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback((containerRef: React.RefObject<HTMLElement>) => {
    setIsTransitioning(true);
    
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch(err => {
          setIsTransitioning(false);
          toast.error(`Erro ao entrar em tela cheia: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen().catch(err => {
        setIsTransitioning(false);
        toast.error(`Erro ao sair da tela cheia: ${err.message}`);
      });
    }
  }, []);

  return {
    isFullscreen,
    isTransitioning,
    toggleFullscreen
  };
};
