
import { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { customScrollbarStyles } from "../utils/cssStyles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Share2, Download, Heart, ChevronLeft, ChevronRight, VolumeIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

const ViewStory = () => {
  const [storyData, setStoryData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pageDirection, setPageDirection] = useState<"left" | "right">("right");
  const [isNarrating, setIsNarrating] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  
  // Add custom scrollbar and fonts
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = customScrollbarStyles;
    document.head.appendChild(styleElement);

    // Add children's fonts from Google
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Bubblegum+Sans&family=Patrick+Hand&family=Schoolbell&display=swap";
    document.head.appendChild(linkElement);

    return () => {
      document.head.removeChild(styleElement);
      document.head.removeChild(linkElement);
    };
  }, []);

  // Load story data from session storage
  useEffect(() => {
    const data = sessionStorage.getItem("storyData");
    if (data) {
      setStoryData(JSON.parse(data));
    }
    
    // Add a small delay to ensure transitions work smoothly
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

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
    // In a real implementation, this would open a sharing dialog
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
      // Fallback for browsers that don't support the Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Link copiado para a área de transferência!"))
        .catch(() => toast.error("Não foi possível copiar o link"));
    }
  };

  const handleDownload = async () => {
    if (!storyData) return;
    
    toast.info("Gerando PDF, por favor aguarde...");
    
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const storyElement = document.getElementById("story-container");
      
      if (!storyElement) return;
      
      // Add cover page first
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(storyData.title, 105, 30, { align: "center" });
      
      // Add cover image if available
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
        
        // Calculate ratio to fit on the PDF page
        const maxWidth = 170; // mm
        const ratio = maxWidth / coverImg.width;
        const imgWidth = coverImg.width * ratio;
        const imgHeight = coverImg.height * ratio;
        
        pdf.addImage(imgData, "JPEG", (210 - imgWidth) / 2, 50, imgWidth, imgHeight);
      }
      
      pdf.setFontSize(12);
      pdf.text(`Uma história sobre ${storyData.childName || storyData.characterName}`, 105, 200, { align: "center" });
      
      // Add each page content
      for (let i = 0; i < storyData.pages.length; i++) {
        pdf.addPage();
        
        const page = storyData.pages[i];
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.text(`Página ${i + 1}`, 105, 20, { align: "center" });
        
        // Add page text
        pdf.setFontSize(14);
        pdf.text(page.text, 20, 40, {
          maxWidth: 170,
          align: "left"
        });
        
        // Add page image if available
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
          
          // Calculate ratio to fit on the PDF page
          const maxWidth = 170; // mm
          const ratio = maxWidth / img.width;
          const imgWidth = img.width * ratio;
          const imgHeight = img.height * ratio;
          
          pdf.addImage(imgData, "JPEG", (210 - imgWidth) / 2, 70, imgWidth, imgHeight);
        }
      }
      
      // Add final page with credits
      pdf.addPage();
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Obrigado por ler!", 105, 30, { align: "center" });
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text("Esta história foi criada com StorySnap", 105, 50, { align: "center" });
      pdf.text(`Personagem principal: ${storyData.childName || storyData.characterName}`, 105, 60, { align: "center" });
      pdf.text(`Data de criação: ${new Date().toLocaleDateString()}`, 105, 70, { align: "center" });
      
      // Save the PDF
      pdf.save(`${storyData.title}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    }
  };

  // Toggle narrative audio
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

  // Toggle navigation controls visibility
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-b from-purple-600 to-indigo-700">
        <div className="text-center">
          <div className="inline-block animate-bounce bg-white p-2 rounded-full mb-4">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Carregando sua história mágica...</h3>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-purple-600 to-indigo-700">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">História não encontrada</h2>
            <p className="mb-6">Parece que não há nenhuma história para exibir. Crie uma nova história primeiro!</p>
            <Button 
              onClick={() => window.location.href = "/create-story"}
              className="bg-storysnap-blue hover:bg-storysnap-blue/90"
            >
              Criar História
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = storyData && currentPage === storyData.pages.length;
  const progress = storyData ? (currentPage / (storyData.pages.length + 1)) * 100 : 0;

  // Page turning animation variants
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
      className="min-h-screen flex flex-col bg-gradient-to-b from-purple-600 to-indigo-700"
    >
      <Navbar />
      
      <main className="flex-1 pt-8 md:pt-16 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated stars background */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-white rounded-full opacity-70"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
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
          {/* Story progress bar */}
          <div className="mb-6 bg-white/20 p-2 rounded-full">
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Story book with page turning effect */}
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
                {/* Cover page */}
                {currentPage === 0 && (
                  <div className="relative">
                    {/* Cover image */}
                    <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-gradient-to-b from-indigo-100 to-purple-100 relative overflow-hidden">
                      {storyData.coverImageUrl && (
                        <img 
                          src={storyData.coverImageUrl} 
                          alt={storyData.title}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    
                    {/* Cover info */}
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
                
                {/* Story pages */}
                {currentPage > 0 && currentPage <= storyData.pages.length && (
                  <div className="grid md:grid-cols-2">
                    {/* Image side */}
                    <div className="bg-gradient-to-b from-indigo-50 to-purple-50 p-4 md:p-8 flex items-center justify-center">
                      <img 
                        src={storyData.pages[currentPage - 1].imageUrl} 
                        alt={`Ilustração página ${currentPage}`}
                        className="max-w-full max-h-[400px] rounded-lg shadow-lg object-contain"
                      />
                    </div>
                    
                    {/* Text side */}
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
                      
                      {/* Page navigation */}
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
                
                {/* End page */}
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
                            onClick={() => window.location.href = "/create-story"}
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
            
            {/* Page corners for page turning effect */}
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
          
          {/* Floating controls */}
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
                {currentPage} / {storyData.pages.length}
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
      
      {/* Add custom styles for page turning effect */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
};

export default ViewStory;
