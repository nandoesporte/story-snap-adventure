
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Pequeno atraso para permitir que a UI se ajuste
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
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
