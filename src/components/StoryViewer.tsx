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
import { useStoryNarration } from '@/hooks/useStoryNarration';
import { NarrationPlayer } from "./NarrationPlayer";
import CoverImage from "./CoverImage";

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
  voiceType?: 'male' | 'female';
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
  ],
  voiceType: 'female'
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
  
  const currentPageIndex = currentPage > 0 ? currentPage - 1 : 0;
  const currentPageText = storyData && currentPage > 0 && storyData.pages[currentPageIndex] 
    ? storyData.pages[currentPageIndex].text 
    : "";
  
  const narration = useStoryNarration({
    storyId: id || '',
    text: currentPageText,
    pageIndex: currentPageIndex
  });
  
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
  
  const coverImageSrc = storyData?.coverImageUrl || storyData?.cover_image_url || "/placeholder.svg";
  
  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        
        if (id && id !== ":id") {
          console.log("Carregando história do banco com ID:", id);
          
          import('../lib/imageHelper').then(({ validateAndFixStoryImages }) => {
            validateAndFixStoryImages(id);
          });
          
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
            
            const coverImage = data.cover_image_url || 
                              (data.pages && data.pages.length > 0 ? data.pages[0].image_url : null) ||
                              "/placeholder.svg";
                              
            console.log("Selected cover image:", coverImage);
            
            const formattedStory: StoryData = {
              title: data.title || "História sem título",
              coverImageUrl: coverImage,
              cover_image_url: coverImage,
              childName: data.character_name || "Leitor",
              childAge: data.character_age || "",
              theme: data.theme || "",
              setting: data.setting || "",
              style: data.style || "",
              voiceType: data.voice_type || 'female',
              pages: Array.isArray(data.pages) 
                ? data.pages.map((page: any) => {
                    console.log("Page image URL:", page.image_url);
                    
                    if (page.image_url) {
                      import('../lib/imageHelper').then(({ storeImageInCache }) => {
                        storeImageInCache(page.image_url);
                      });
                    }
                    
                    return {
                      text: page.text || "",
                      imageUrl: page.image_url || "/placeholder.svg",
                      image_url: page.image_url || "/placeholder.svg"
                    };
                  })
                : [{ text: "Não há conteúdo disponível.", imageUrl: "/placeholder.svg" }]
            };
            
            if (coverImage) {
              import('../lib/imageHelper').then(({ storeImageInCache }) => {
                storeImageInCache(coverImage);
              });
            }
            
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
          
          const coverImage = parsedData.coverImageUrl || parsedData.cover_image_url || 
                           (parsedData.pages && parsedData.pages.length > 0 ? 
                             (parsedData.pages[0].imageUrl || parsedData.pages[0].image_url) : 
                             "/placeholder.svg");
          
          const formattedStory: StoryData = {
            title: parsedData.title || "História sem título",
            coverImageUrl: coverImage,
            cover_image_url: coverImage,
            childName: parsedData.childName || parsedData.character_name || "Leitor",
            childAge: parsedData.childAge || parsedData.character_age || "",
            theme: parsedData.theme || "",
            setting: parsedData.setting || "",
            style: parsedData.style || "",
            voiceType: parsedData.voiceType || 'female',
            pages: Array.isArray(parsedData.pages) 
              ? parsedData.pages.map((page: any) => ({
                  text: page.text || "",
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
      adventure: "/images/covers/adventure.jpg",
      fantasy: "/images/covers/fantasy.jpg",
      space: "/images/covers/space.jpg",
      ocean: "/images/covers/ocean.jpg",
      dinosaurs: "/images/covers/dinosaurs.jpg",
      forest: "/images/placeholders/adventure.jpg"
    };
    
    const themeLower = theme.toLowerCase();
    for (const [key, url] of Object.entries(themeImages)) {
      if (themeLower.includes(key)) {
        return url;
      }
    }
    
    return "/placeholder.svg";
  };
  
  const handleImageError = (url: string) => {
    console.log("Failed to load image URL:", url);
    setFailedImages(prev => ({...prev, [url]: true}));
    
    import('../lib/imageHelper').then(({ getImageFromCache }) => {
      const cachedUrl = getImageFromCache(url);
      if (cachedUrl) {
        console.log("Recovered image from cache:", url);
        if (storyData) {
          if (storyData.coverImageUrl === url || storyData.cover_image_url === url) {
            setStoryData({
              ...storyData,
              coverImageUrl: cachedUrl,
              cover_image_url: cachedUrl
            });
          }
          
          const updatedPages = storyData.pages.map(page => {
            if (page.imageUrl === url || page.image_url === url) {
              return {
                ...page,
                imageUrl: cachedUrl,
                image_url: cachedUrl
              };
            }
            return page;
          });
          
          setStoryData({
            ...storyData,
            pages: updatedPages
          });
        }
      } else if (Object.keys(failedImages).length < 2) {
        toast.error("Algumas imagens não puderam ser carregadas. Exibindo imagens alternativas.", {
          id: "image-load-error",
          duration: 3000
        });
      }
    });
  };
  
  const getImageUrl = (url?: string, theme: string = ""): string => {
    if (!url || url === "" || url === "null" || url === "undefined") {
      return getFallbackImage(theme);
    }
    
    const cachedUrlKey = `image_cache_${url.split('/').pop()}`;
    const cachedUrl = localStorage.getItem(cachedUrlKey);
    if (cachedUrl) {
      return cachedUrl;
    }
    
    if (url.includes("supabase") && url.includes("storage") && !url.includes("object")) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucketName = pathParts[pathParts.length - 2];
        const fileName = pathParts[pathParts.length - 1];
        
        const { data } = supabase
          .storage
          .from(bucketName)
          .getPublicUrl(fileName);
        
        localStorage.setItem(cachedUrlKey, data.publicUrl);
        
        console.log("Reformatted storage URL:", data.publicUrl);
        return data.publicUrl;
      } catch (error) {
        console.error("Failed to parse storage URL:", error);
      }
    }
    
    if (url.startsWith("/") && !url.startsWith("//")) {
      const fullUrl = `${window.location.origin}${url}`;
      localStorage.setItem(cachedUrlKey, fullUrl);
      return fullUrl;
    }
    
    if (failedImages[url]) {
      return getFallbackImage(theme);
    }
    
    if (url.startsWith("http") || url.startsWith("data:")) {
      if (url.startsWith("http")) {
        localStorage.setItem(cachedUrlKey, url);
      }
      return url;
    }
    
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    
    localStorage.setItem(cachedUrlKey, fullUrl);
    
    return fullUrl;
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
    const fallbackImage = getFallbackImage(theme);
    
    if (isMobile) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50">
              <CoverImage 
                imageUrl={coverImageSrc}
                fallbackImage={fallbackImage}
                alt={storyData.title}
                className="w-full h-full object-cover transition-all duration-300"
                onClick={() => handleImageClick(coverImageSrc)}
                onError={() => handleImageError(coverImageSrc)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-md">{storyData.title}</h2>
                <p className="text-xl text-white/90 mb-3 drop-shadow-md">Uma história para {storyData.childName}</p>
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
        </div>
      );
    }
    
    return (
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-full flex flex-col bg-gradient-to-br from-violet-50 to-indigo-50">
          <div className="flex-1 p-4 flex items-center justify-center">
            <CoverImage 
              imageUrl={coverImageSrc}
              fallbackImage={fallbackImage}
              alt={storyData.title}
              className="max-w-full max-h-[70vh] object-contain rounded-xl transition-all duration-300 shadow-md"
              onClick={() => handleImageClick(coverImageSrc)}
              onError={() => handleImageError(coverImageSrc)}
            />
          </div>
          <div className="p-6 bg-white border-t border-gray-100 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">{storyData.title}</h2>
            <p className="text-lg text-gray-600 mb-3">Uma história para {storyData.childName}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {storyData.theme && (
                <span className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm">
                  {storyData.theme}
                </span>
              )}
              {storyData.setting && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {storyData.setting}
                </span>
              )}
              {storyData.style && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
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
                <div className="relative z-10 p-4 pb-6">
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
                  
                  <div className="mt-4 flex justify-center gap-2">
                    <NarrationPlayer
                      storyId={id || ''}
                      pageIndex={pageIndex}
                      pageText={page.text}
                      voiceType={storyData.voiceType || 'female'}
                      className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              className="fixed bottom-24 right-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 flex items-center gap-1 shadow-lg"
              size="sm"
              variant="ghost"
              onClick={toggleTextVisibility}
            >
              {hideText ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {hideText ? "Mostrar texto" : "Ocultar texto"}
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
                    <NarrationPlayer
                      storyId={id || ''}
                      pageIndex={pageIndex}
                      pageText={page.text}
                      voiceType={storyData.voiceType || 'female'}
                    />
                    <span>{storyData.childName}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic">Texto oculto</p>
                </div>
              )}
              
              {!isMobile && !hideText && (
                <Button 
                  className="absolute bottom-4 right-4 z-10"
                  size="sm"
                  variant="secondary"
                  onClick={toggleTextVisibility}
                >
                  <EyeOff className="w-4 h-4" />
                  Ocultar texto
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-gray-50 flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div ref={storyContainerRef} className="flex-1 flex flex-col h-full">
          <div className="bg-white border-b border-gray-200 p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoHome} 
                className="text-gray-600"
              >
                <Home className="w-4 h-4" />
                <span className="ml-1 hidden md:inline">Início</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCreateNew} 
                className="text-gray-600"
              >
                <BookText className="w-4 h-4" />
                <span className="ml-1 hidden md:inline">Nova História</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-gray-600"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  <span className="ml-1 hidden md:inline">
                    {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                  </span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareStory}
                className="text-gray-600"
              >
                <Share className="w-4 h-4" />
                <span className="ml-1 hidden md:inline">Compartilhar</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="text-gray-600"
              >
                <Download className="w-4 h-4" />
                <span className="ml-1 hidden md:inline">
                  {isDownloading ? "Processando..." : "Download PDF"}
                </span>
              </Button>
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={bookRef}
              className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                isFlipping ? (flipDirection === "left" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0") : ""
              }`}
            >
              {currentPage === 0 ? renderCoverPage() : renderStoryPage(currentPage - 1)}
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
              <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-md pointer-events-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0 || isFlipping}
                  className="hover:bg-gray-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <span className="text-sm text-gray-800">
                  {currentPage} / {totalPages - 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1 || isFlipping}
                  className="hover:bg-gray-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Dialog open={showImageViewer} onOpenChange={setShowImageViewer}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            <div 
              className="overflow-auto w-full h-full flex items-center justify-center"
              style={{ transform: `scale(${imageZoom})` }}
            >
              <img 
                src={currentImageUrl} 
                alt="Visualização ampliada"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleZoomIn}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleZoomOut}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowImageViewer(false)}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryViewer;
