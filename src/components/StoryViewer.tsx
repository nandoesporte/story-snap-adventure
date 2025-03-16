
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

type StoryPage = {
  text: string;
  imageUrl: string;
};

type StoryData = {
  title: string;
  coverImageUrl: string;
  childImage: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  pages: StoryPage[];
};

const StoryViewer = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  useEffect(() => {
    const data = sessionStorage.getItem("storyData");
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setStoryData(parsedData);
      } catch (error) {
        console.error("Error parsing story data:", error);
      }
    }
    setLoading(false);
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-storysnap-blue"></div>
      </div>
    );
  }
  
  if (!storyData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Nenhuma história encontrada</h2>
        <p className="mb-8 text-muted-foreground">
          Parece que você ainda não criou uma história. Que tal criar uma agora?
        </p>
        <Button onClick={() => navigate("/create-story")}>
          Criar História
        </Button>
      </div>
    );
  }
  
  const totalPages = storyData.pages.length + 1; // +1 for cover page
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const generatePDF = async () => {
    try {
      setIsPdfGenerating(true);
      toast.info("Gerando PDF da história. Isso pode levar alguns instantes...");
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const storyContainer = document.getElementById('story-container');
      
      if (!storyContainer) {
        throw new Error("Elemento da história não encontrado");
      }
      
      // First, capture the current page
      const currentPageElement = storyContainer.querySelector('.story-page');
      if (!currentPageElement) {
        throw new Error("Página atual não encontrada");
      }
      
      // Save current page index
      const originalPage = currentPage;
      
      // Cover page first
      setCurrentPage(0);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
      
      let canvas = await html2canvas(storyContainer.querySelector('.story-page') as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      
      // Add all other pages
      for (let i = 1; i < totalPages; i++) {
        setCurrentPage(i);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
        
        canvas = await html2canvas(storyContainer.querySelector('.story-page') as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, 297));
      }
      
      // Download the PDF
      pdf.save(`${storyData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      
      // Restore original page
      setCurrentPage(originalPage);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  return (
    <div className="relative">
      <div 
        id="story-container" 
        className="bg-white rounded-2xl shadow-xl overflow-hidden aspect-[3/4] max-w-2xl mx-auto"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="story-page h-full"
          >
            {currentPage === 0 ? (
              // Cover page
              <div className="flex flex-col h-full">
                <div className="flex-1 relative overflow-hidden">
                  <img 
                    src={storyData.coverImageUrl} 
                    alt="Capa da história" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white opacity-90"></div>
                </div>
                <div className="p-8 text-center">
                  <h1 className="text-3xl font-bold mb-4">
                    {storyData.title}
                  </h1>
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-storysnap-blue">
                      <img 
                        src={storyData.childImage} 
                        alt={storyData.childName} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <p className="text-lg">
                    Uma história mágica sobre<br />
                    <span className="font-bold text-xl">{storyData.childName}</span>
                  </p>
                </div>
              </div>
            ) : (
              // Story pages
              <div className="flex flex-col h-full">
                <div className="flex-1 relative">
                  <img 
                    src={storyData.pages[currentPage - 1].imageUrl} 
                    alt={`Ilustração da página ${currentPage}`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white opacity-70"></div>
                </div>
                <div className="p-6">
                  <p className="text-lg leading-relaxed font-medium">
                    {storyData.pages[currentPage - 1].text}
                  </p>
                  <div className="text-right mt-2 text-sm text-slate-500">
                    Página {currentPage} de {totalPages - 1}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={18} />
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home size={18} />
            Início
          </Button>
          
          <Button
            variant="outline"
            onClick={generatePDF}
            disabled={isPdfGenerating}
            className="flex items-center gap-2"
          >
            <Download size={18} />
            {isPdfGenerating ? "Gerando..." : "Baixar PDF"}
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-2"
        >
          Próxima
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default StoryViewer;
