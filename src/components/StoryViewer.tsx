import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Home, BookText, Share, Maximize, Minimize, ZoomIn, ZoomOut, X, Eye, EyeOff, Volume, VolumeX } from "lucide-react";
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
import { useStoryImages } from "@/hooks/useStoryImages";
import { useStoryNarration } from '@/hooks/useStoryNarration';

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
  
  // Create a single instance of the narration hook with memoized parameters
  // This ensures we don't conditionally render hooks
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
            console.log("Cover image URL:", data.cover_image_url);
            console.log("First page image:", data.pages && data.pages.length > 0 ? data.pages[0].image_url : "N/A");
            
            const coverImage = data.cover_image_url || (data.pages && data.pages.length > 0 ? data.pages[0].image_url : null);
            console.log("Selected cover image:", coverImage);
            
            const formattedStory: StoryData = {
              title: data.title,
              coverImageUrl: coverImage || "/placeholder.svg",
              cover_image_url: coverImage || "/placeholder.svg",
              childName: data.character_name,
              childAge: data.character_age || "",
              theme: data.theme || "",
              setting: data.setting || "",
              style: data.style,
              pages: Array.isArray(data.pages) 
                ? data.pages.map((page: any) => {
                    console.log("Page image URL:", page.image_url);
                    return {
                      text: page.text,
                      imageUrl: page.image_url || "/placeholder.svg",
                      image_url: page.image_url || "/placeholder.svg"
                    };
                  })
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
              (parsedData.pages[0].imageUrl || parsedData.cover_image_url || "/placeholder.svg") : 
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
    
    if (Object.keys(failedImages).length < 2) {
      toast.error("Algumas imagens não puderam ser carregadas. Exibindo imagens alternativas.", {
        id: "image-load-error",
        duration: 3000
      });
    }
  };
  
  const getImageUrl = (url?: string, theme: string = ""): string => {
    if (!url || url === "" || url === "null" || url === "undefined") {
      return getFallbackImage(theme);
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
        
        console.log("Reformatted storage URL:", data.publicUrl);
        return data.publicUrl;
      } catch (error) {
        console.error("Failed to parse storage URL:", error);
      }
    }
    
    if (url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    
    if (failedImages[url]) {
      return getFallbackImage(theme);
    }
    
    if (url.startsWith("http") || url.startsWith("data:")) {
      return url;
    }
    
    const baseUrl = window.location.origin;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
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
        {!isMobile && (
          <div className="w-full h-full flex flex-col bg-gradient-to-br from-violet-50 to-indigo-50">
            <div className="flex-1 p-4 flex items-center justify-center">
              <img 
                src={coverImage} 
                alt={storyData.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl transition-all duration-300 shadow-md"
                onClick={() => handleImageClick(coverImage)}
                onError={() => handleImageError(coverImage)}
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
        )}
        
        {isMobile && (
          <div className="w-full h-full flex flex-col">
            <div className="w-full h-full relative overflow-hidden rounded-2xl shadow-lg">
              {isMobile ? (
                <div className="w-full h-full bg-gradient-to-br from-violet-50 to-indigo-50">
                  <img 
                    src={coverImage} 
                    alt={storyData.title}
                    className="w-full h-full object-cover p-4 transition-all duration-300"
                    onClick={() => handleImageClick(coverImage)}
                    onError={() => handleImageError(coverImage)}
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
              ) : (
                <div className="w-full h-full flex flex-col bg-gradient-to-br from-violet-50 to-indigo-50">
                  <div className="flex-1 p-4">
                    <img 
                      src={coverImage} 
                      alt={storyData.title}
                      className="w-full h-full object-cover rounded-xl transition-all duration-300 shadow-md"
                      onClick={() => handleImageClick(coverImage)}
                      onError={() => handleImageError(coverImage)}
                    />
                  </div>
                  <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center text-center">
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
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderStoryPage = (pageIndex: number) => {
    if (!storyData || !storyData.pages[pageIndex]) return null;
    
    const page = storyData.pages[pageIndex];
    const theme = storyData.theme || "";
    const imageUrl = getImageUrl(page.imageUrl || page.image_url, theme);
    
    // Use the narration hook instance that was created at the component level
    // instead of creating a new one here
    const { isGenerating, isPlaying, playAudio, VOICE_IDS } = narration;
    
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
                    <Button 
                      className="bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 rounded-full flex items-center gap-1"
                      size="sm"
                      variant="ghost"
                      onClick={() => playAudio(VOICE_IDS.female)}
                    >
                      {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                      {isPlaying ? "Parar" : "Voz Feminina"}
                    </Button>
                    
                    <Button 
                      className="bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 rounded-full flex items-center gap-1"
                      size="sm"
                      variant="ghost"
                      onClick={() => playAudio(VOICE_IDS.male)}
                    >
                      {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                      {isPlaying ? "Parar" : "Voz Masculina"}
                    </Button>
                    
                    {isMobile && (
                      <Button 
                        className="bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 rounded-full flex items-center gap-1"
                        size="sm"
                        variant="ghost"
                        onClick={toggleTextVisibility}
                      >
                        <EyeOff className="w-4 h-4" />
                        Ocultar texto
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {hideText && (
              <Button 
                className="fixed bottom-4 right-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm py-1 px-3 flex items-center gap-1 shadow-lg"
                size="sm"
                variant="ghost"
                onClick={toggleTextVisibility}
              >
                <Eye className="w-4 h-4" />
                Mostrar texto
              </Button>
            )}
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
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => playAudio(VOICE_IDS.female)}
                        className="flex items-center gap-1"
                      >
                        {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                        {isPlaying ? "Parar" : "Voz Feminina"}
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => playAudio(VOICE_IDS.male)}
                        className="flex items-center gap-1"
                      >
                        {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume className="w-4 h-4" />}
                        {isPlaying ? "Parar" : "Voz Masculina"}
                      </Button>
                    </div>
                    <span>{storyData.childName}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic">Texto oculto</p>
                </div>
              )}
              
              {!isMobile && !hideText ? (
                <Button 
                  className="absolute bottom-4 right-4 z-10"
                  size="sm"
                  variant="secondary"
                  onClick={toggleTextVisibility}
                >
                  <EyeOff className="mr-2 w-4 h-4" />
                  Ocultar Texto
                </Button>
              ) : null}
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
                className
