
import React, { useRef, useEffect } from "react";
import { CoverPage } from "./CoverPage";
import { StoryPage } from "./StoryPage";
import { getImageUrl, preloadImage } from "./helpers";
import { toast } from "sonner";

interface PageTransitionProps {
  storyId: string | undefined;
  storyData: any;
  currentPage: number;
  isFlipping: boolean;
  flipDirection: "left" | "right";
  isRendered: boolean;
  isFullscreen: boolean;
  isMobile: boolean;
  hideText: boolean;
  onImageClick: (url: string) => void;
  onImageError: (url: string) => void;
  onToggleTextVisibility: () => void;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  storyId,
  storyData,
  currentPage,
  isFlipping,
  flipDirection,
  isRendered,
  isFullscreen,
  isMobile,
  hideText,
  onImageClick,
  onImageError,
  onToggleTextVisibility
}) => {
  const bookRef = useRef<HTMLDivElement>(null);
  
  // Log de depuração
  useEffect(() => {
    console.log("PageTransition renderizada:", {
      currentPage,
      isMobile,
      isFullscreen,
      hasStoryData: !!storyData,
      isRendered,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
  }, [currentPage, isMobile, isFullscreen, storyData, isRendered]);
  
  // Verificar se temos dados da história
  if (!storyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Nenhum conteúdo de história disponível</p>
      </div>
    );
  }
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  // Pré-carregar imagens das páginas adjacentes para melhorar as transições
  useEffect(() => {
    if (!storyData || !storyData.pages || storyData.pages.length === 0) return;
    
    const preloadAdjacentPages = async () => {
      try {
        // Pré-carregar imagem da página atual
        const currentImageUrl = currentPage === 0 
          ? coverImageSrc 
          : (storyData.pages[currentPage - 1]?.imageUrl || storyData.pages[currentPage - 1]?.image_url);
          
        if (currentImageUrl) {
          await preloadImage(getImageUrl(currentImageUrl, storyData.theme));
        }
        
        // Pré-carregar imagem da próxima página se disponível
        if (currentPage < storyData.pages.length) {
          const nextImageUrl = currentPage === 0 
            ? (storyData.pages[0]?.imageUrl || storyData.pages[0]?.image_url)
            : (storyData.pages[currentPage]?.imageUrl || storyData.pages[currentPage]?.image_url);
            
          if (nextImageUrl) {
            await preloadImage(getImageUrl(nextImageUrl, storyData.theme));
          }
        }
        
        // Pré-carregar imagem da página anterior se disponível
        if (currentPage > 0) {
          const prevImageUrl = currentPage === 1 
            ? coverImageSrc
            : (storyData.pages[currentPage - 2]?.imageUrl || storyData.pages[currentPage - 2]?.image_url);
            
          if (prevImageUrl) {
            await preloadImage(getImageUrl(prevImageUrl, storyData.theme));
          }
        }
      } catch (error) {
        console.error("Erro ao pré-carregar páginas adjacentes:", error);
      }
    };
    
    preloadAdjacentPages();
  }, [currentPage, storyData, coverImageSrc]);
  
  // Calcular classes de transição com base no estado
  const transitionClasses = `
    absolute inset-0 w-full h-full
    transition-all duration-300 ease-in-out 
    ${isFlipping ? (flipDirection === "left" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0") : "translate-x-0"} 
    ${isRendered ? 'opacity-100' : 'opacity-0'}
  `;
  
  return (
    <div
      ref={bookRef}
      className={transitionClasses}
      data-testid="story-book-container"
      style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {currentPage === 0 ? (
        <CoverPage
          title={storyData.title || "História sem título"}
          coverImageSrc={coverImageSrc}
          childName={storyData.childName || "criança"}
          theme={storyData.theme || ""}
          setting={storyData.setting || ""}
          style={storyData.style || ""}
          isMobile={isMobile}
          onImageClick={onImageClick}
          onImageError={onImageError}
        />
      ) : (
        <StoryPage
          storyId={storyId}
          title={storyData.title || "História sem título"}
          imageUrl={getImageUrl(
            storyData.pages[currentPage - 1]?.imageUrl || 
            storyData.pages[currentPage - 1]?.image_url,
            storyData.theme
          )}
          pageIndex={currentPage - 1}
          pageCount={storyData.pages?.length || 0}
          childName={storyData.childName || "criança"}
          typedText={storyData.typedText || storyData.pages[currentPage - 1]?.text || ""}
          isFullscreen={isFullscreen}
          isMobile={isMobile}
          hideText={hideText}
          voiceType={storyData.voiceType || 'female'}
          onImageClick={onImageClick}
          onImageError={onImageError}
          onToggleTextVisibility={onToggleTextVisibility}
        />
      )}
    </div>
  );
}
