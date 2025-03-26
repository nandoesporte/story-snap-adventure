
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Home, BookText, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface StoryPage {
  text: string;
  imageUrl: string;
}

interface StoryData {
  title: string;
  coverImageUrl: string;
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
      text: "Não foi possível carregar esta história. Por favor, tente criar uma nova história.",
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
  const bookRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        
        // Carregar dados do sessionStorage se não tiver ID na URL
        if (!id) {
          const savedData = sessionStorage.getItem("storyData");
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            setStoryData(parsedData);
            setTotalPages(parsedData.pages.length + 1); // +1 para a capa
          } else {
            console.error("Nenhum dado de história encontrado no sessionStorage");
            setStoryData(defaultStory);
            setTotalPages(defaultStory.pages.length + 1);
          }
        } else {
          // Implementar carregamento da história por ID quando necessário
          console.log("Carregando história por ID:", id);
          setStoryData(defaultStory);
          setTotalPages(defaultStory.pages.length + 1);
        }
      } catch (error) {
        console.error("Erro ao carregar a história:", error);
        toast.error("Erro ao carregar a história");
        setStoryData(defaultStory);
        setTotalPages(defaultStory.pages.length + 1);
      } finally {
        setLoading(false);
      }
    };
    
    loadStory();
  }, [id]);
  
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
      
      // Adicionar capa
      if (bookRef.current) {
        setCurrentPage(0);
        // Dar tempo para a página renderizar
        await new Promise(r => setTimeout(r, 500));
        
        const coverCanvas = await html2canvas(bookRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        const coverImgData = coverCanvas.toDataURL("image/jpeg", 0.9);
        pdf.addImage(coverImgData, "JPEG", 0, 0, 297, 210);
      }
      
      // Adicionar páginas
      for (let i = 0; i < storyData.pages.length; i++) {
        pdf.addPage();
        setCurrentPage(i + 1);
        
        // Dar tempo para a página renderizar
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
      
      // Voltar para a capa depois de gerar o PDF
      setCurrentPage(0);
      
      // Salvar PDF
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-lg font-medium">Gerando PDF da história...</p>
            <p className="text-sm text-gray-500">Por favor, aguarde um momento.</p>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-7xl bg-white shadow-2xl rounded-lg overflow-hidden mb-8">
        <div className="flex justify-between items-center bg-storysnap-blue p-4 text-white">
          <div className="flex items-center">
            <BookText className="mr-2 h-6 w-6" />
            <h1 className="text-xl font-bold truncate">{storyData.title}</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white hover:bg-storysnap-blue/80"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:text-white hover:bg-storysnap-blue/80"
              onClick={handleGoHome}
            >
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
          </div>
        </div>
        
        <div className="relative bg-slate-100 min-h-[70vh] flex items-center justify-center overflow-hidden">
          {/* Navegação de página */}
          <button 
            className={`absolute left-4 z-10 p-3 rounded-full bg-white/90 shadow-lg transition-opacity ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-white'}`}
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button 
            className={`absolute right-4 z-10 p-3 rounded-full bg-white/90 shadow-lg transition-opacity ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 hover:bg-white'}`}
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Livro com efeito de página */}
          <div 
            className="relative w-full h-full max-w-4xl max-h-[70vh] perspective-1000"
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
                {currentPage === 0 ? (
                  // Capa
                  <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-6">
                    <div className="absolute inset-0 bg-white shadow-md m-3 rounded-lg overflow-hidden">
                      <div className="w-full h-full relative">
                        <img 
                          src={storyData.coverImageUrl} 
                          alt={storyData.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
                          <h2 className="text-3xl md:text-4xl font-bold mb-2">{storyData.title}</h2>
                          <p className="text-xl mb-1">Uma história para {storyData.childName}</p>
                          <p className="text-sm opacity-80">Tema: {storyData.theme} • Cenário: {storyData.setting}</p>
                          {storyData.characterName && (
                            <p className="text-sm opacity-80">Com {storyData.characterName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Páginas do livro
                  <div className="w-full h-full flex flex-col md:flex-row">
                    <div className="w-full md:w-1/2 h-full p-4 md:p-8 bg-white overflow-auto flex flex-col justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">{storyData.title}</h2>
                        <div className="prose prose-lg">
                          {storyData.pages[currentPage - 1]?.text.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-3">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        Página {currentPage} de {totalPages - 1}
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 h-full bg-gray-100 relative overflow-hidden">
                      <img 
                        src={storyData.pages[currentPage - 1]?.imageUrl || "/placeholder.svg"} 
                        alt={`Ilustração da página ${currentPage}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Navegação de página em formato de pontos */}
        <div className="flex justify-center items-center py-4 bg-white">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full transition-colors ${currentPage === idx ? 'bg-storysnap-blue' : 'bg-gray-300 hover:bg-gray-400'}`}
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
      
      <div className="flex gap-4 mb-12">
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
    </div>
  );
};

export default StoryViewer;
