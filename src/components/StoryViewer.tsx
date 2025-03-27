import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Home, BookText, Share, Maximize, Minimize, ZoomIn, ZoomOut, X, BookOpenText, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Book3DViewer from "./3D/Book3D";

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
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const bookRef = useRef<HTMLDivElement>(null);
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
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
              coverImageUrl: data.cover_image_url || "/placeholder.svg",
              cover_image_url: data.cover_image_url || "/placeholder.svg",
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
            coverImageUrl: parsedData.coverImageUrl || parsedData.cover_image_url || "/placeholder.svg",
            cover_image_url: parsedData.coverImageUrl || parsedData.cover_image_url || "/placeholder.svg",
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
  
  const handlePageTurn = (newPage: number) => {
    if (newPage !== currentPage) {
      setFlipDirection(newPage > currentPage ? "right" : "left");
      setCurrentPage(newPage);
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
  
  const renderCoverPage = () => {
    if (!storyData) return null;
    
    const coverImage = storyData.coverImageUrl || storyData.cover_image_url || "/placeholder.svg";
    
    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-3 md:p-6">
        <div className="absolute inset-0 bg-white shadow-md m-2 md:m-3 rounded-lg overflow-hidden">
          <div className="w-full h-full relative flex flex-col">
            <div className="flex-grow relative">
              <img 
                src={coverImage} 
                alt={storyData.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleImageClick(coverImage)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Prevent infinite error loop
                  console.log("Erro ao carregar imagem da capa, usando placeholder");
                  target.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 bg-gradient-to-t from-black/70 to-transparent text-white space-y-1">
              <h2 className="text-2xl md:text-4xl font-bold mb-1 line-clamp-2">{storyData.title}</h2>
              <p className="text-lg md:text-xl opacity-90">Uma história para {storyData.childName}</p>
              <div className="text-xs md:text-sm opacity-80 space-y-1">
                <p>Tema: {storyData.theme} • Cenário: {storyData.setting}</p>
                {storyData.characterName && (
                  <p>Com {storyData.characterName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderStoryPage = (pageIndex: number) => {
    if (!storyData || !storyData.pages[pageIndex]) return null;
    
    const page = storyData.pages[pageIndex];
    const imageUrl = page.imageUrl || page.image_url || "/placeholder.svg";
    
    return (
      <div className="w-full h-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 h-1/2 md:h-full p-3 md:p-6 lg:p-8 bg-white overflow-auto flex flex-col justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-gray-800">{storyData.title}</h2>
            <div className="prose prose-sm md:prose-lg">
              {page.text.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2 md:mb-3">{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500">
            Página {pageIndex + 1} de {storyData.pages.length}
          </div>
        </div>
        <div className="w-full md:w-1/2 h-1/2 md:h-full bg-gray-100 relative overflow-hidden">
          <img 
            src={imageUrl} 
            alt={`Ilustração da página ${pageIndex + 1}`}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => handleImageClick(imageUrl)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite error loop
              console.log(`Erro ao carregar imagem da página ${pageIndex + 1}, usando placeholder`);
              target.src = "/placeholder.svg";
            }}
          />
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg">Carregando sua história...</p>
      </div>
    );
  }
  
  if (!storyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
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
    <div className="flex flex-col items-center justify-center min-h-screen p-2 md:p-4 bg-gray-50">
      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg font-medium">Gerando PDF da história...</p>
            <p className="text-sm text-gray-500">Por favor, aguarde um momento.</p>
          </div>
        </div>
      )}
      
      {showImageViewer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
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
          <div 
            className="flex-1 overflow-auto flex items-center justify-center"
            onClick={() => setShowImageViewer(false)}
          >
            <img 
              src={currentImageUrl} 
              alt="Visualização da imagem"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${imageZoom})` }}
            />
          </div>
        </div>
      )}
      
      <div 
        ref={storyContainerRef}
        className={`w-full max-w-7xl bg-white shadow-2xl rounded-lg overflow-hidden mb-4 md:mb-8 
                   ${isFullscreen ? 'fixed inset-0 z-40 max-w-none rounded-none' : ''}`}
      >
        <div className="flex justify-between items-center bg-storysnap-blue p-2 md:p-4 text-white">
          <div className="flex items-center">
            <BookText className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-bold truncate">{storyData?.title}</h1>
          </div>
          <div className="flex gap-1 md:gap-2">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "2d" | "3d")}
              className="h-8"
            >
              <TabsList className="bg-storysnap-blue/30 h-8">
                <TabsTrigger 
                  value="2d" 
                  className="text-white data-[state=active]:bg-white/20 h-7 px-2 text-xs"
                >
                  <BookOpenText className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">2D</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="3d" 
                  className="text-white data-[state=active]:bg-white/20 h-7 px-2 text-xs"
                >
                  <Box className="h-4 w-4 mr-1" />
                  <span className="hidden md:inline">3D</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {!isMobile && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-storysnap-blue/80"
                  onClick={handleShareStory}
                >
                  <Share className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Compartilhar</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white hover:bg-storysnap-blue/80"
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
              className="text-white hover:text-white hover:bg-storysnap-blue/80"
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
              className="text-white hover:text-white hover:bg-storysnap-blue/80"
              onClick={handleGoHome}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative bg-slate-100 min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
          {viewMode === "2d" && (
            <>
              <button 
                className={`absolute left-2 md:left-4 z-10 p-2 md:p-3 rounded-full bg-white/90 shadow-lg transition-opacity ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-white'}`}
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              
              <button 
                className={`absolute right-2 md:right-4 z-10 p-2 md:p-3 rounded-full bg-white/90 shadow-lg transition-opacity ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-white'}`}
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              
              <div 
                className="relative w-full h-full max-w-4xl max-h-[60vh] md:max-h-[70vh] perspective-[1000px]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ 
                      rotateY: flipDirection === "right" ? -90 : 90,
                      opacity: 0,
                      scale: 0.9
                    }}
                    animate={{ 
                      rotateY: 0,
                      opacity: 1,
                      scale: 1
                    }}
                    exit={{ 
                      rotateY: flipDirection === "right" ? 90 : -90,
                      opacity: 0,
                      scale: 0.9
                    }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 25 
                    }}
                    style={{ 
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden"
                    }}
                    className="w-full h-full flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden bg-white"
                    ref={bookRef}
                  >
                    {currentPage === 0 
                      ? renderCoverPage()
                      : renderStoryPage(currentPage - 1)
                    }
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
          
          {viewMode === "3d" && storyData && (
            <div className="w-full h-full max-w-4xl max-h-[60vh] md:max-h-[70vh]">
              <Book3DViewer
                coverImage={storyData.coverImageUrl || storyData.cover_image_url}
                pages={storyData.pages.map(page => ({ 
                  text: page.text,
                  imageUrl: page.imageUrl || page.image_url
                }))}
                currentPage={currentPage}
                onPageTurn={handlePageTurn}
                title={storyData.title}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-center items-center py-2 md:py-4 bg-white">
          <div className="flex space-x-1 md:space-x-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${currentPage === idx ? 'bg-storysnap-blue' : 'bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => {
                  setFlipDirection(idx > currentPage ? "right" : "left");
                  setIsFlipping(true);
                  setTimeout(() => {
                    setCurrentPage(idx);
                    setIsFlipping(false);
                  }, 300);
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {isMobile ? (
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="mb-4 w-full">
              Opções da História
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4 space-y-3">
              <Button variant="default" className="w-full" onClick={handleCreateNew}>
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
          <Button variant="default" onClick={handleCreateNew}>
            <BookText className="mr-2 h-4 w-4" />
            Criar Nova História
          </Button>
          <Button variant="default" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Baixar como PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
