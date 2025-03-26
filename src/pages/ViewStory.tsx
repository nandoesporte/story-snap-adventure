
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { customScrollbarStyles } from "../utils/cssStyles";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ArrowRight, 
  Share2, 
  Download, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  VolumeIcon,
  AlertTriangle,
  ImageIcon,
  RefreshCwIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useStoryBot } from "@/hooks/useStoryBot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LeonardoWebhookConfig from "@/components/LeonardoWebhookConfig";

const ViewStory = () => {
  const navigate = useNavigate();
  const { 
    generateConsistentStoryImages, 
    leonardoApiAvailable
  } = useStoryBot();
  // Remove leonardoWebhookUrl from destructuring since it's no longer available
  
  const [storyData, setStoryData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pageDirection, setPageDirection] = useState<"left" | "right">("right");
  const [isNarrating, setIsNarrating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const [storyMeta, setStoryMeta] = useState<any>({});
  const [imagesGenerated, setImagesGenerated] = useState(false);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = customScrollbarStyles;
    document.head.appendChild(styleElement);

    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Bubblegum+Sans&family=Patrick+Hand&family=Schoolbell&display=swap";
    document.head.appendChild(linkElement);

    return () => {
      document.head.removeChild(styleElement);
      document.head.removeChild(linkElement);
    };
  }, []);

  useEffect(() => {
    try {
      console.log("Attempting to load story data from sessionStorage");
      const data = sessionStorage.getItem("storyData");
      
      if (!data) {
        console.warn("No story data found in sessionStorage");
        setLoadError("Não foi possível encontrar os dados da história");
        setLoading(false);
        return;
      }
      
      const parsedData = JSON.parse(data);
      console.log("Successfully loaded story data:", parsedData);
      
      if (!parsedData.title || !parsedData.pages || !Array.isArray(parsedData.pages)) {
        console.error("Invalid story data format:", parsedData);
        setLoadError("Formato de dados da história inválido");
        setLoading(false);
        return;
      }
      
      if (parsedData.pages && Array.isArray(parsedData.pages)) {
        parsedData.pages = parsedData.pages.map((page: any, index: number) => {
          if (!page.imageUrl && page.image_url) {
            console.log(`Page ${index + 1} using image_url:`, page.image_url);
            return {
              ...page,
              imageUrl: page.image_url
            };
          }
          
          if (page.imageUrl) {
            console.log(`Page ${index + 1} already has imageUrl:`, page.imageUrl);
            return page;
          }
          
          console.log(`Page ${index + 1} has no image URL, using placeholder`);
          const themeImages: {[key: string]: string} = {
            adventure: "/images/placeholders/adventure.jpg",
            fantasy: "/images/placeholders/fantasy.jpg",
            space: "/images/placeholders/space.jpg",
            ocean: "/images/placeholders/ocean.jpg",
            dinosaurs: "/images/placeholders/dinosaurs.jpg"
          };
          return {
            ...page,
            imageUrl: themeImages[parsedData.theme as keyof typeof themeImages] || "/placeholder.svg"
          };
        });
      }
      
      console.log("Processed pages data:", parsedData.pages);
      setStoryData(parsedData);
      
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error loading story data:", error);
      setLoadError(`Erro ao carregar dados da história: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const selectedCharacterId = localStorage.getItem('selected_character');
    const characterName = localStorage.getItem('character_name');
    
    if (selectedCharacterId && characterName) {
      console.log("Using selected character:", characterName);
      setStoryMeta(prev => ({
        ...prev,
        characterName: characterName
      }));
      
      loadCharacterData(selectedCharacterId);
    }
  }, []);

  useEffect(() => {
    if (storyData && !loading && !imagesGenerated && leonardoApiAvailable) {
      const hasNoImages = storyData.pages.some((page: any) => 
        !page.imageUrl || page.imageUrl.includes('placeholders') || page.imageUrl.includes('placeholder.svg')
      );
      
      if (hasNoImages) {
        console.log("Story loaded without images. Auto-generating illustrations...");
        toast.info("Gerando ilustrações para a história...");
        generateIllustrations();
        setImagesGenerated(true);
      }
    }
  }, [storyData, loading, leonardoApiAvailable, imagesGenerated]);

  const loadCharacterData = async (characterId: string) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
        
      if (error) {
        console.error("Error loading character data:", error);
        return;
      }
      
      if (data) {
        setStoryMeta(prev => ({
          ...prev,
          characterName: data.name,
          characterPrompt: data.generation_prompt || data.description
        }));
      }
    } catch (err) {
      console.error("Error in loadCharacterData:", err);
    }
  };

  const generateIllustrations = async () => {
    if (!storyData || !storyData.pages || storyData.pages.length === 0) {
      toast.error("Dados da história não encontrados");
      return;
    }
    
    if (!leonardoApiAvailable) {
      toast.error("Leonardo AI não está disponível. Verifique as configurações.");
      return;
    }
    
    setIsRegeneratingImages(true);
    toast.info("Iniciando geração de ilustrações para a história...");
    
    try {
      const pageTexts = storyData.pages.map((page: any) => page.text);
      
      const characterName = storyData.characterName || storyMeta.characterName || "Personagem";
      const theme = storyData.theme || "adventure";
      const setting = storyData.setting || "forest";
      const characterPrompt = storyData.characterPrompt || storyMeta.characterPrompt || null;
      const style = storyData.style || "cartoon";
      
      const newImages = await generateConsistentStoryImages(
        pageTexts,
        characterName,
        theme,
        setting,
        characterPrompt,
        style,
        storyData.childImage || null
      );
      
      console.log("Generated new images:", newImages);
      
      const updatedPages = storyData.pages.map((page: any, index: number) => ({
        ...page,
        imageUrl: newImages[index] || page.imageUrl
      }));
      
      const updatedStoryData = {
        ...storyData,
        pages: updatedPages
      };
      
      sessionStorage.setItem("storyData", JSON.stringify(updatedStoryData));
      
      setStoryData(updatedStoryData);
      
      toast.success("Ilustrações geradas com sucesso!");
    } catch (error) {
      console.error("Error generating illustrations:", error);
      toast.error("Erro ao gerar ilustrações. Tente novamente.");
    } finally {
      setIsRegeneratingImages(false);
    }
  };

  const handleNextPage = () => {
    if (storyData && currentPage < storyData.pages.length) {
      setPageDirection("right");
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setPageDirection("left");
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: storyData?.title || "História Personalizada",
      text: "Confira esta história incrível que eu criei!",
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log("Shared successfully"))
        .catch(err => console.log("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Link copiado para a área de transferência!"))
        .catch(() => toast.error("Não foi possível copiar o link"));
    }
  };

  const regenerateAllIllustrations = async () => {
    await generateIllustrations();
  };

  const handleDownload = async () => {
    if (!storyData) return;
    
    toast.info("Gerando PDF, por favor aguarde...");
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const storyElement = document.getElementById("story-container");
      
      if (!storyElement) return;
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(storyData.title, 105, 30, { align: "center" });
      
      if (storyData.coverImageUrl) {
        const coverImg = document.createElement("img");
        coverImg.src = storyData.coverImageUrl;
        
        await new Promise((resolve) => {
          coverImg.onload = resolve;
        });
        
        const canvas = document.createElement("canvas");
        canvas.width = coverImg.width;
        canvas.height = coverImg.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(coverImg, 0, 0);
        
        const imgData = canvas.toDataURL("image/jpeg", 0.75);
        
        const maxWidth = 170;
        const ratio = maxWidth / coverImg.width;
        const imgWidth = coverImg.width * ratio;
        const imgHeight = coverImg.height * ratio;
        
        pdf.addImage(imgData, "JPEG", (210 - imgWidth) / 2, 50, imgWidth, imgHeight);
      }
      
      pdf.setFontSize(12);
      pdf.text(`Uma história sobre ${storyData.childName || storyData.characterName}`, 105, 200, { align: "center" });
      
      for (let i = 0; i < storyData.pages.length; i++) {
        pdf.addPage();
        
        const page = storyData.pages[i];
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text(`Página ${i + 1}`, 105, 20, { align: "center" });
        
        pdf.setFontSize(14);
        pdf.text(page.text, 20, 40, {
          maxWidth: 170,
          align: "left"
        });
        
        if (page.imageUrl) {
          const img = document.createElement("img");
          img.src = page.imageUrl;
          
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          
          const imgData = canvas.toDataURL("image/jpeg", 0.75);
          
          const maxWidth = 170;
          const ratio = maxWidth / img.width;
          const imgWidth = img.width * ratio;
          const imgHeight = img.height * ratio;
          
          pdf.addImage(imgData, "JPEG", (210 - imgWidth) / 2, 70, imgWidth, imgHeight);
        }
      }
      
      pdf.addPage();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Obrigado por ler!", 105, 30, { align: "center" });
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text("Esta história foi criada com StorySnap", 105, 50, { align: "center" });
      pdf.text(`Personagem principal: ${storyData.childName || storyData.characterName}`, 105, 60, { align: "center" });
      pdf.text(`Data de criação: ${new Date().toLocaleDateString()}`, 105, 70, { align: "center" });
      
      pdf.save(`${storyData.title}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    }
  };

  const toggleNarration = () => {
    if (!storyData) return;
    
    if (isNarrating) {
      window.speechSynthesis?.cancel();
      setIsNarrating(false);
      toast.info("Narração interrompida");
    } else {
      setIsNarrating(true);
      
      let textToRead = "";
      if (currentPage === 0) {
        textToRead = `${storyData.title}. Uma história ${storyData.childName ? 'para ' + storyData.childName : 'com ' + storyData.characterName}.`;
      } else if (currentPage <= storyData.pages.length) {
        textToRead = storyData.pages[currentPage - 1].text;
      }
      
      if (textToRead && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        
        utterance.onend = () => {
          setIsNarrating(false);
        };
        
        window.speechSynthesis.speak(utterance);
        toast.success("Narração iniciada");
      }
    }
  };

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-bounce bg-purple-100 p-2 rounded-full mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Carregando sua história mágica...</h3>
        </div>
      </div>
    );
  }

  if (loadError || !storyData) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md">
            <div className="text-center mb-6">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Problema ao carregar história</h2>
              {loadError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{loadError}</AlertDescription>
                </Alert>
              )}
              <p className="mb-6 text-gray-600">
                Tente criar uma nova história ou retorne à página inicial.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => navigate("/create-story")}
                className="bg-storysnap-blue hover:bg-storysnap-blue/90"
              >
                Criar Nova História
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/")}
              >
                Voltar para o Início
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = storyData && currentPage === storyData.pages.length;
  const progress = storyData ? (currentPage / (storyData.pages.length + 1)) * 100 : 0;

  const pageVariants = {
    enter: (direction: "left" | "right") => ({
      x: direction === "right" ? 1000 : -1000,
      opacity: 0,
      rotateY: direction === "right" ? -20 : 20,
      zIndex: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      zIndex: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    },
    exit: (direction: "left" | "right") => ({
      x: direction === "right" ? -1000 : 1000,
      opacity: 0,
      rotateY: direction === "right" ? 20 : -20,
      zIndex: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    })
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-white"
    >
      <Navbar />
      
      <main className="flex-1 pt-8 md:pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-purple-200 rounded-full opacity-40"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        <div id="story-container" className="container mx-auto max-w-5xl px-4">
          <div className="mb-6 bg-purple-100 p-2 rounded-full">
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              {leonardoApiAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateAllIllustrations}
                  disabled={isRegeneratingImages}
                  className="text-xs flex items-center gap-1"
                >
                  {isRegeneratingImages ? (
                    <>
                      <RefreshCwIcon className="h-3 w-3 animate-spin" />
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3" />
                      Regenerar Ilustrações
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Configurar Leonardo AI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configuração do Leonardo AI</DialogTitle>
                </DialogHeader>
                <LeonardoWebhookConfig />
              </DialogContent>
            </Dialog>
          </div>
          
          <div 
            ref={bookRef}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden book-container perspective-1000"
            onClick={toggleControls}
          >
            <AnimatePresence mode="wait" custom={pageDirection}>
              <motion.div
                key={currentPage}
                custom={pageDirection}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                {currentPage === 0 && (
                  <div className="relative">
                    <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gradient-to-b from-indigo-100 to-purple-100 relative overflow-hidden">
                      {storyData.coverImageUrl && (
                        <img 
                          src={storyData.coverImageUrl} 
                          alt={storyData.title}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    
                    <div className="p-6 md:p-10">
                      <h1 className="text-3xl md:text-4xl font-bold mb-4 font-['Bubblegum_Sans']">
                        {storyData.title}
                      </h1>
                      
                      <div className="flex items-center mb-6">
                        {(storyData.childImage || storyData.characterImage) && (
                          <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-purple-200 mr-4">
                            <img 
                              src={storyData.childImage || storyData.characterImage} 
                              alt={storyData.childName || storyData.characterName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-700">
                            Protagonista: {storyData.childName || storyData.characterName}
                          </p>
                          {storyData.childAge && (
                            <p className="text-sm text-gray-500">
                              Idade: {storyData.childAge}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h3 className="font-bold text-purple-800 mb-1">Tema</h3>
                          <p>{storyData.theme === 'adventure' ? 'Aventura' : 
                          storyData.theme === 'fantasy' ? 'Fantasia' : 
                          storyData.theme === 'space' ? 'Espaço' : 
                          storyData.theme === 'ocean' ? 'Oceano' : 
                          'Dinossauros'}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <h3 className="font-bold text-indigo-800 mb-1">Cenário</h3>
                          <p>{storyData.setting === 'forest' ? 'Floresta Encantada' : 
                          storyData.setting === 'castle' ? 'Castelo Mágico' : 
                          storyData.setting === 'space' ? 'Espaço Sideral' : 
                          storyData.setting === 'underwater' ? 'Mundo Submarino' : 
                          'Terra dos Dinossauros'}</p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleNextPage}
                        className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
                      >
                        Começar a Leitura
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {currentPage > 0 && currentPage <= storyData.pages.length && (
                  <div className="grid md:grid-cols-2">
                    <div className="bg-gradient-to-b from-indigo-50 to-purple-50 p-4 md:p-8 flex items-center justify-center">
                      {storyData.pages[currentPage - 1].imageUrl ? (
                        <img 
                          src={storyData.pages[currentPage - 1].imageUrl} 
                          alt={`Ilustração página ${currentPage}`}
                          className="max-w-full max-h-[400px] rounded-lg shadow-lg object-contain"
                          onError={(e) => {
                            console.error("Image failed to load:", storyData.pages[currentPage - 1].imageUrl);
                            const target = e.target as HTMLImageElement;
                            const themeImages: {[key: string]: string} = {
                              adventure: "/images/placeholders/adventure.jpg",
                              fantasy: "/images/placeholders/fantasy.jpg",
                              space: "/images/placeholders/space.jpg",
                              ocean: "/images/placeholders/ocean.jpg",
                              dinosaurs: "/images/placeholders/dinosaurs.jpg"
                            };
                            target.src = themeImages[storyData.theme as keyof typeof themeImages] || "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="w-16 h-16 mb-2" />
                          <p>Imagem não disponível</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 md:p-10 flex flex-col">
                      <div className="mb-2 text-sm text-purple-600 font-medium">
                        Página {currentPage} de {storyData.pages.length}
                      </div>
                      
                      <h2 className="text-2xl font-bold mb-6 font-['Bubblegum_Sans']">
                        A história de {storyData.childName || storyData.characterName}
                      </h2>
                      
                      <div className="flex-1 mb-8">
                        <p className="text-lg leading-relaxed font-['Comic_Neue']">
                          {storyData.pages[currentPage - 1].text}
                        </p>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          onClick={handlePrevPage}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        
                        <Button 
                          onClick={handleNextPage}
                          className="bg-storysnap-blue hover:bg-storysnap-blue/90 flex items-center gap-2"
                        >
                          {currentPage === storyData.pages.length ? 'Finalizar' : 'Próximo'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentPage > storyData.pages.length && (
                  <div className="p-8 md:p-16 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="mb-8">
                        <div className="inline-block p-4 rounded-full bg-purple-100 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                          </svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-4 font-['Bubblegum_Sans']">Fim da História!</h2>
                        <p className="text-gray-600 mb-8">
                          Esperamos que tenha gostado da incrível aventura de {storyData.childName || storyData.characterName}!
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <Button 
                          onClick={handleDownload}
                          className="w-full py-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Baixar História em PDF
                        </Button>
                        
                        <Button 
                          onClick={handleShare}
                          variant="outline"
                          className="w-full py-6 flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-5 h-5" />
                          Compartilhar História
                        </Button>
                        
                        <Button 
                          onClick={() => setLiked(!liked)}
                          variant="ghost"
                          className={`w-full py-6 flex items-center justify-center gap-2 ${liked ? 'text-pink-500' : ''}`}
                        >
                          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                          {liked ? 'Você adorou esta história!' : 'Marcar como favorita'}
                        </Button>
                        
                        <div className="border-t border-gray-200 pt-6 mt-4">
                          <Button 
                            onClick={() => navigate("/create-story")}
                            className="w-full py-6 bg-storysnap-blue hover:bg-storysnap-blue/90"
                          >
                            Criar Outra História
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            {currentPage > 0 && currentPage <= storyData.pages.length && (
              <>
                <div 
                  className="page-corner-right"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPage();
                  }}
                />
                <div 
                  className="page-corner-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPage();
                  }}
                />
              </>
            )}
          </div>
          
          {showControls && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-10">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevPage();
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={isFirstPage}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="px-2 flex items-center text-sm font-medium">
                {currentPage} / {storyData?.pages.length}
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextPage();
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={isLastPage}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNarration();
                }}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isNarrating ? 'bg-indigo-100 text-indigo-600' : ''}`}
              >
                <VolumeIcon className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <style>
        {`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .page-corner-right {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 50px 50px;
          border-color: transparent transparent rgba(139, 92, 246, 0.3) transparent;
          cursor: pointer;
          z-index: 10;
          transition: border-color 0.2s ease;
        }
        
        .page-corner-right:hover {
          border-color: transparent transparent rgba(139, 92, 246, 0.5) transparent;
        }
        
        .page-corner-left {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 50px 0 0 50px;
          border-color: transparent transparent transparent rgba(139, 92, 246, 0.3);
          cursor: pointer;
          z-index: 10;
          transition: border-color 0.2s ease;
        }
        
        .page-corner-left:hover {
          border-color: transparent transparent transparent rgba(139, 92, 246, 0.5);
        }
        
        .book-container {
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.3), 
            0 0 5px rgba(0, 0, 0, 0.1), 
            0 -5px 10px rgba(0, 0, 0, 0.1) inset;
          position: relative;
          transform-style: preserve-3d;
        }

        .story-header {
          background: linear-gradient(to right, #f5f3ff, #ede9fe);
          border-bottom: 4px solid #c4b5fd;
        }
        
        .story-title {
          color: #7c3aed;
          text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.5);
        }
        
        .story-action-button {
          @apply bg-white/70 backdrop-blur-sm text-violet-700 border border-violet-200 hover:bg-white/90 transition-all duration-200;
        }
        `}
      </style>
    </div>
  );
};

export default ViewStory;
