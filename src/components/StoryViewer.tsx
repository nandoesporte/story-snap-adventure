import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Home, BookText, Share, Maximize, Minimize, ZoomIn, ZoomOut, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useTypingEffect } from "@/hooks/useTypingEffect";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface StoryPage {
  text: string;
  imageUrl?: string;
  image_url?: string;
}

interface StoryData {
  title: string;
  coverImageUrl?: string;
  cover_image_url?: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  characterName?: string;
  pages: StoryPage[];
  language?: string;
  style?: string;
  moral?: string;
  readingLevel?: string;
}

const defaultStory: StoryData = {
  title: "História não encontrada",
  coverImageUrl: "/placeholder.svg",
  childName: "",
  childAge: "",
  theme: "",
  setting: "",
  pages: [
    {
      text: "Não foi possível carregar esta história. Por favor, tente criar uma nova história personalizada.",
      imageUrl: "/placeholder.svg"
    }
  ]
};

const StoryViewer: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"left" | "right">("right");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [hideText, setHideText] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  
  const currentText = storyData && currentPage > 0 && storyData.pages[currentPage - 1] 
    ? storyData.pages[currentPage - 1].text 
    : "";
  
  const typedText = useTypingEffect(
    currentText, 
    currentPage, 
    30, 
    true, 
    800, 
    isMobile ? 400 : undefined
  );
  
  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        
        if (id && id !== ":id") {
          console.log("Carregando história do banco com ID:", id);
          const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("id", id)
            .single();
            
          if (error) {
            console.error("Erro ao carregar história do banco:", error);
            toast.error("Erro ao carregar história do banco de dados");
            
            loadFromSessionStorage();
            return;
          }
          
          if (data) {
            console.log("Dados da história carregados:", data);
            const formattedStory: StoryData = {
              title: data.title,
              coverImageUrl: data.pages && data.pages.length > 0 && data.pages[0].image_url ? 
                data.pages[0].image_url : (data.cover_image_url || "/placeholder.svg"),
              cover_image_url: data.pages && data.pages.length > 0 && data.pages[0].image_url ? 
                data.pages[0].image_url : (data.cover_image_url || "/placeholder.svg"),
              childName: data.character_name,
              childAge: data.character_age || "",
              theme: data.theme || "",
              setting: data.setting || "",
              style: data.style,
              pages: Array.isArray(data.pages) 
                ? data.pages.map((page: any) => ({
                    text: page.text,
                    imageUrl: page.image_url || "/placeholder.svg",
                    image_url: page.image_url || "/placeholder.svg"
                  }))
                : [{ text: "Não há conteúdo disponível.", imageUrl: "/placeholder.svg" }]
            };
            
            setStoryData(formattedStory);
            setTotalPages(formattedStory.pages.length + 1);
            setLoading(false);
          } else {
            loadFromSessionStorage();
          }
        } else {
          loadFromSessionStorage();
        }
      } catch (error) {
        console.error("Erro ao carregar a história:", error);
        toast.error("Erro ao carregar a história");
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
        setLoading(false);
      }
    };
    
    const loadFromSessionStorage = () => {
      try {
        const savedData = sessionStorage.getItem("storyData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("Dados carregados do sessionStorage:", parsedData);
          
          const formattedStory: StoryData = {
            title: parsedData.title,
            coverImageUrl: parsedData.pages && parsedData.pages.length > 0 && 
              (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) ? 
              (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
              (parsedData.coverImageUrl || parsedData.cover_image_url || "/placeholder.svg"),
            cover_image_url: parsedData.pages && parsedData.pages.length > 0 && 
              (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) ? 
              (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
              (parsedData.coverImageUrl || parsedData.cover_image_url || "/placeholder.svg"),
            childName: parsedData.childName || parsedData.character_name,
            childAge: parsedData.childAge || parsedData.character_age || "",
            theme: parsedData.theme || "",
            setting: parsedData.setting || "",
            style: parsedData.style,
            pages: Array.isArray(parsedData.pages) 
              ? parsedData.pages.map((page: any) => ({
                  text: page.text,
                  imageUrl: page.imageUrl || page.image_url || "/placeholder.svg",
                  image_url: page.imageUrl || page.image_url || "/placeholder.svg"
                }))
              : [{ text: "Não há conteúdo disponível.", imageUrl: "/placeholder.svg" }]
          };
          
          setStoryData(formattedStory);
          setTotalPages(formattedStory.pages.length + 1);
        } else {
          console.error("Nenhum dado de história encontrado no sessionStorage");
          setStoryData(defaultStory);
          setTotalPages(defaultStory.pages.length + 1);
        }
      } catch (storageError) {
        console.error("Erro ao carregar dados do sessionStorage:", storageError);
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
      } finally {
        setLoading(false);
      }
    };
    
    loadStory();
  }, [id]);
  
  const getFallbackImage = (theme: string = ""): string => {
    const themeImages: {[key: string]: string} = {
      adventure: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      fantasy: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      space: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      ocean: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
      dinosaurs: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
      forest: "https://images.unsplash.com/photo-1472396961693-142e6e269027"
    };
    
    return themeImages[theme.toLowerCase() as keyof typeof themeImages] || "/placeholder.svg";
  };
  
  const handleImageError = (url: string) => {
    console.log("Failed to load image URL:", url);
    setFailedImages(prev => ({...prev, [url]: true}));
    
    if (Object.keys(failedImages).length < 2) {
      toast.error("Algumas imagens não puderam ser carregadas. Exibindo imagens alternativas.", {
        id: "image-load-error",
        duration: 3000
      });
    }
  };
  
  const getImageUrl = (url?: string, theme: string = ""): string => {
    if (!url || failedImages[url]) {
      return getFallbackImage(theme);
    }
    return url;
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (storyContainerRef.current) {
        storyContainerRef.current.requestFullscreen().catch(err => {
          toast.error(`Erro ao entrar em tela cheia: ${err.message}`);
        });
      }
    } else {
      document.exitFullscreen().catch(err => {
        toast.error(`Erro ao sair da tela cheia: ${err.message}`);
      });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setFlipDirection("left");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  };
  
  const handleNextPage = () => {
    if (storyData && currentPage < totalPages - 1) {
      setFlipDirection("right");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!storyData) return;
    
    try {
      setIsDownloading(true);
      toast.info("Preparando o PDF da história...");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      if (bookRef.current) {
        setCurrentPage(0);
        await new Promise(r => setTimeout(r, 500));
        
        const coverCanvas = await html2canvas(bookRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        const coverImgData = coverCanvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(coverImgData, "JPEG", 0, 0, 297, 210);
      }
      
      for (let i = 0; i < storyData.pages.length; i++) {
        pdf.addPage();
        setCurrentPage(i + 1);
        
        await new Promise(r => setTimeout(r, 500));
        
        if (bookRef.current) {
          const canvas = await html2canvas(bookRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
          });
          const imgData = canvas.toDataURL("image/jpeg", 0.9);
          pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
        }
      }
      
      setCurrentPage(0);
      pdf.save(`${storyData.title.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF da história baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF da história");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleCreateNew = () => {
    navigate("/create-story");
  };
  
  const handleGoHome = () => {
    navigate("/");
  };
  
  const handleShareStory = () => {
    if (!storyData) return;
    
    if (id) {
      const shareUrl = `${window.location.origin}/view-story/${id}`;
      
      if (navigator.share) {
        navigator.share({
          title: storyData.title,
          text: `Confira esta história incrível: ${storyData.title}`,
          url: shareUrl
        }).catch(err => {
          console.error("Erro ao compartilhar:", err);
          copyToClipboard(shareUrl);
        });
      } else {
        copyToClipboard(shareUrl);
      }
    } else {
      toast.info("Salve a história primeiro para poder compartilhá-la.");
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success("Link copiado para a área de transferência!");
      })
      .catch(err => {
        console.error("Erro ao copiar texto:", err);
        toast.error("Não foi possível copiar o link");
      });
  };
  
  const handleImageClick = (url: string) => {
    if (url === "/placeholder.svg" || url.includes("/images/placeholders/")) {
      return;
    }
    setCurrentImageUrl(url);
    setShowImageViewer(true);
    setImageZoom(1);
  };
  
  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.2, 3));
  };
  
  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const toggleTextVisibility = () => {
    setHideText(!hideText);
  };
  
  const renderCoverPage = () => {
    if (!storyData) return null;
    
    const theme = storyData.theme || "";
    const coverImage = getImageUrl(storyData.coverImageUrl || storyData.cover_image_url, theme);
    
    return (
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg">
          <div className="w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50">
            <img 
              src={coverImage} 
              alt={storyData.title}
              className="w-full h-full object-contain p-4 transition-all duration-300"
              onClick={() => handleImageClick(coverImage)}
              onError={() => handleImageError(coverImage)}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-md">{storyData.title}</h2>
            <p className="text-xl md:text-2xl text-white/90 mb-3 drop-shadow-md">Uma história para {storyData.childName}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {storyData.theme && (
                <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm">
                  {storyData.theme}
                </span>
              )}
              {storyData.setting && (
                <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm">
                  {storyData.setting}
                </span>
              )}
              {storyData.style && (
                <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white rounded-full text-sm">
                  {storyData.style}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderStoryPage = (pageIndex: number) => {
    if (!storyData || !storyData.pages[pageIndex]) return null;
    
    const page = storyData.pages[pageIndex];
    const theme = storyData.theme || "";
    const imageUrl = getImageUrl(page.imageUrl || page.image_url, theme);
    
    return (
      <div className="w-full h-full flex flex-col">
        {isMobile ? (
          <div className="w-full h-full flex flex-col relative overflow-hidden">
            <div className="story-image-fullscreen">
              <img 
                src={imageUrl} 
                alt={`Ilustração da página ${pageIndex + 1}`}
                className="w-full h-full object-cover"
                onClick={() => handleImageClick(imageUrl)}
                onError={() => handleImageError(page.imageUrl || page.image_url || "")}
              />
            </div>
            
            {!hideText && (
              <div className="story-text-overlay">
                <div className="relative z-10 p-4 pb-0">
                  <h2 className="text-xl font-bold mb-3 text-white text-shadow">{storyData.title}</h2>
                  <div className="prose prose-sm story-text text-white">
                    {typedText.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-2 leading-relaxed text-shadow">{paragraph}</p>
                    ))}
                    <div className="typing-cursor animate-blink inline-block h-5 w-1 ml-1 bg-white"></div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-white/30 text-xs text-white/80 flex justify-between">
                    <span>Página {pageIndex + 1} de {storyData.pages.length}</span>
                    <span>{storyData.childName}</span>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              className="absolute bottom-4 right-4 z-20 rounded-full"
              size="sm"
              variant="ghost"
              onClick={toggleTextVisibility}
            >
              {hideText ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-white" />}
            </Button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-row">
            <div className="w-1/2 h-full bg-gradient-to-br from-violet-50 to-indigo-50 border-r border-gray-100 flex items-center justify-center p-6">
              <img 
                src={imageUrl} 
                alt={`Ilustração da página ${pageIndex + 1}`}
                className="max-w-full max-h-full object-contain cursor-pointer rounded-lg shadow-md"
                onClick={() => handleImageClick(imageUrl)}
                onError={() => handleImageError(page.imageUrl || page.image_url || "")}
              />
            </div>
            
            <div className="w-1/2 h-full p-8 bg-white overflow-auto flex flex-col justify-between relative">
              {!hideText ? (
                <>
                  <ScrollArea className="h-full pr-2">
                    <div className="mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">{storyData.title}</h2>
                      <div className="prose prose-lg">
                        {typedText.split('\n').map((paragraph, idx) => (
                          <p key={idx} className="mb-3 text-lg">{paragraph}</p>
                        ))}
                        <div className="typing-cursor animate-blink inline-block h-6 w-1 ml-1 bg-gray-500"></div>
                      </div>
                    </div>
                  </ScrollArea>
                  <div className="mt-6 pt-3 border-t text-sm text-gray-500 flex justify-between items-center">
                    <span>Página {pageIndex + 1} de {storyData.pages.length}</span>
                    <span>{storyData.childName}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic">Texto oculto</p>
                </div>
              )}
              
              <Button 
                className="absolute bottom-4 right-4 z-10"
                size="sm"
                variant="secondary"
                onClick={toggleTextVisibility}
              >
                {hideText ? <Eye className="mr-2 w-4 h-4" /> : <EyeOff className="mr-2 w-4 h-4" />}
                {hideText ? "Mostrar Texto" : "Ocultar Texto"}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-violet-50 to-indigo-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg">Carregando sua história...</p>
      </div>
    );
  }
  
  if (!storyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="glass p-8 rounded-xl text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">História não encontrada</h2>
          <p className="mb-6">Não foi possível encontrar esta história. Crie uma nova história personalizada.</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleGoHome}>Voltar ao Início</Button>
            <Button variant="default" onClick={handleCreateNew}>Criar Nova História</Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 p-2 md:p-4">
      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg font-medium">Gerando PDF da história...</p>
            <p className="text-sm text-gray-500">Por favor, aguarde um momento.</p>
          </div>
        </div>
      )}
      
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-7xl bg-black/95 border-none p-0" onEscapeKeyDown={() => setShowImageViewer(false)}>
          <div className="p-3 flex justify-between items-center text-white">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => setShowImageViewer(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 h-[80vh]">
            <div className="relative max-w-full max-h-full">
              <img 
                src={currentImageUrl} 
                alt="Visualização da imagem"
                className="max-w-full max-h-[70vh] object-contain transition-transform duration-200 rounded-lg"
                style={{ transform: `scale(${imageZoom})` }}
                onError={() => handleImageError(currentImageUrl)}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div 
        ref={storyContainerRef}
        className={`w-full max-w-7xl bg-white shadow-2xl rounded-2xl overflow-hidden mb-4 md:mb-8 
                   ${isFullscreen ? 'fixed inset-0 z-40 max-w-none rounded-none' : ''}`}
      >
        <div className={`${isMobile ? 'hidden' : 'flex'} justify-between items-center bg-gradient-to-r from-violet-600 to-indigo-600 p-3 text-white`}>
          <div className="flex items-center">
            <BookText className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-bold truncate">{storyData?.title}</h1>
          </div>
          <div className="flex gap-1 md:gap-2">
            {!isMobile && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-white/10"
                  onClick={handleShareStory}
                >
                  <Share className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Compartilhar</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-white/10"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Baixar PDF</span>
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white hover:bg-white/10"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white hover:bg-white/10"
              onClick={handleGoHome}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative bg-gradient-to-br from-violet-50 to-indigo-50 min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
          <button 
            className={`absolute left-3 md:left-6 z-20 p-2 md:p-3 rounded-full bg-white/90 shadow-lg transition-opacity ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-white'}`}
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          
          <button 
            className={`absolute right-3 md:right-6 z-20 p-2 md:p-3 rounded-full bg-white/90 shadow-lg transition-opacity ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-white'}`}
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </button>
          
          <div 
            className="w-full h-full max-h-[70vh]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ 
                  rotateY: flipDirection === "right" ? -5 : 5,
                  opacity: 0,
                  scale: 0.95
                }}
                animate={{ 
                  rotateY: 0,
                  opacity: 1,
                  scale: 1
                }}
                exit={{ 
                  rotateY: flipDirection === "right" ? 5 : -5,
                  opacity: 0,
                  scale: 0.95
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25 
                }}
                className="w-full h-full overflow-hidden bg-white shadow-lg border border-gray-100 rounded-lg"
                ref={bookRef}
              >
                {currentPage === 0 
                  ? renderCoverPage()
                  : renderStoryPage(currentPage - 1)
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex justify-center items-center py-3 md:py-4 bg-white">
          <div className="flex space-x-1 md:space-x-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors duration-200 
                  ${currentPage === idx 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => {
                  setFlipDirection(idx > currentPage ? "right" : "left");
                  setIsFlipping(true);
                  setTimeout(() => {
                    setCurrentPage(idx);
                    setIsFlipping(false);
                  }, 300);
                }}
                aria-label={`Ir para página ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>
            <Button className="mb-4 w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-none">
              Opções da História
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4 space-y-3">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleCreateNew}>
                <BookText className="mr-2 h-4 w-4" />
                Criar Nova História
              </Button>
              <Button variant="outline" className="w-full" onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Baixar como PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={handleShareStory}>
                <Share className="mr-2 h-4 w-4" />
                Compartilhar História
              </Button>
              <Button variant="outline" className="w-full" onClick={toggleTextVisibility}>
                {hideText ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                {hideText ? "Mostrar Texto" : "Ocultar Texto"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <div className="flex gap-4 mb-8">
          <Button variant="outline" onClick={handleGoHome}>
            <Home className="mr-2 h-4 w-4" />
            Voltar ao Início
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleCreateNew}>
            <BookText className="mr-2 h-4 w-4" />
            Criar Nova História
          </Button>
          <Button variant="secondary" onClick={toggleTextVisibility}>
            {hideText ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {hideText ? "Mostrar Texto" : "Ocultar Texto"}
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Baixar como PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
