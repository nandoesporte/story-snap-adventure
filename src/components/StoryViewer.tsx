
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Home, BookOpen } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"single" | "spread">("single");
  
  // Load story data from session storage
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
  
  // Enhanced PDF generation with book-like formatting
  const generatePDF = async () => {
    try {
      setIsPdfGenerating(true);
      toast.info("Gerando PDF da história. Isso pode levar alguns instantes...");
      
      // Use A5 landscape format which is more like a typical children's book
      const pdf = new jsPDF('l', 'mm', 'a5');
      const storyContainer = document.getElementById('story-container');
      
      if (!storyContainer) {
        throw new Error("Elemento da história não encontrado");
      }
      
      // Save current page index
      const originalPage = currentPage;
      
      // Generate a nicer title page first
      pdf.setFillColor(255, 230, 240); // Light pink background for cover
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
      
      // Add cover image
      setCurrentPage(0);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
      
      let canvas = await html2canvas(storyContainer.querySelector('.story-page') as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      const imgWidth = pdf.internal.pageSize.getWidth() - 20; // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 10, 10, imgWidth, Math.min(imgHeight, pdf.internal.pageSize.getHeight() - 20));
      
      // Add all other pages with decorative elements
      for (let i = 1; i < totalPages; i++) {
        setCurrentPage(i);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
        
        pdf.addPage();
        
        // Add a light colored background for each page
        pdf.setFillColor(250, 250, 255); // Very light blue background
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
        
        // Add decorative border
        pdf.setDrawColor(100, 150, 255);
        pdf.setLineWidth(3);
        pdf.rect(5, 5, pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 10, 'S');
        
        // Add page number in a decorative bubble
        pdf.setFillColor(100, 150, 255);
        pdf.circle(pdf.internal.pageSize.getWidth() - 15, pdf.internal.pageSize.getHeight() - 15, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text(i.toString(), pdf.internal.pageSize.getWidth() - 15, pdf.internal.pageSize.getHeight() - 12);
        
        // Reset text color for main content
        pdf.setTextColor(0, 0, 0);
        
        // Capture the page content
        canvas = await html2canvas(storyContainer.querySelector('.story-page') as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        // Calculate dimensions to fit within the decorative border
        const contentWidth = pdf.internal.pageSize.getWidth() - 20;
        const contentHeight = (canvas.height * contentWidth) / canvas.width;
        
        pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 10, 10, contentWidth, Math.min(contentHeight, pdf.internal.pageSize.getHeight() - 20));
      }
      
      // Add a final page with a "The End" message
      pdf.addPage();
      pdf.setFillColor(255, 245, 225); // Light warm background for ending
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
      
      // Add decorative border
      pdf.setDrawColor(255, 150, 100);
      pdf.setLineWidth(3);
      pdf.rect(5, 5, pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 10, 'S');
      
      // Add "The End" text
      pdf.setFontSize(32);
      pdf.setTextColor(100, 100, 150);
      pdf.setFont(undefined, 'bold');
      
      // Center the text
      const text = "Fim";
      const textWidth = pdf.getStringUnitWidth(text) * 32 / pdf.internal.scaleFactor;
      const textX = (pdf.internal.pageSize.getWidth() - textWidth) / 2;
      const textY = pdf.internal.pageSize.getHeight() / 2;
      
      pdf.text(text, textX, textY);
      
      // Add a small note with the app name
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont(undefined, 'normal');
      const appNote = "Criado com StorySnap";
      const noteWidth = pdf.getStringUnitWidth(appNote) * 10 / pdf.internal.scaleFactor;
      pdf.text(appNote, (pdf.internal.pageSize.getWidth() - noteWidth) / 2, pdf.internal.pageSize.getHeight() - 10);
      
      // Download the PDF with the story title as filename
      const filename = storyData.title.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñ]/g, '_');
      pdf.save(`${filename}.pdf`);
      
      // Restore original page
      setCurrentPage(originalPage);
      
      toast.success("Livro em PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF. Por favor, tente novamente.");
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  // Toggle between single page and spread view
  const toggleViewMode = () => {
    setViewMode(viewMode === "single" ? "spread" : "single");
  };
  
  return (
    <div className="relative">
      {/* Story Book Mode Selector */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full shadow-md p-1 flex">
          <Button
            variant={viewMode === "single" ? "default" : "ghost"}
            onClick={() => setViewMode("single")}
            className="rounded-full"
            size="sm"
          >
            Página Única
          </Button>
          <Button
            variant={viewMode === "spread" ? "default" : "ghost"}
            onClick={() => setViewMode("spread")}
            className="rounded-full"
            size="sm"
          >
            Livro Aberto
          </Button>
        </div>
      </div>
      
      {/* Book container with conditional spread view */}
      <div className={`flex justify-center perspective ${viewMode === "spread" ? "book-spread" : ""}`}>
        {viewMode === "spread" && currentPage > 0 && (
          <div 
            className="bg-white rounded-l-2xl shadow-xl overflow-hidden aspect-[3/4] max-w-md mx-auto transform rotate-y-180 book-left-page"
            style={{
              boxShadow: "-5px 5px 15px rgba(0, 0, 0, 0.1)",
              borderRight: "1px solid #e0e0e0"
            }}
          >
            <div className="h-full bg-slate-50 p-6 flex flex-col justify-center items-center text-center">
              <p className="text-lg text-slate-400">
                {currentPage > 1 ? `Página ${currentPage - 1}` : ""}
              </p>
            </div>
          </div>
        )}
        
        <div 
          id="story-container" 
          className={`bg-white ${viewMode === "spread" ? (currentPage === 0 ? "rounded-2xl" : "rounded-r-2xl") : "rounded-2xl"} shadow-xl overflow-hidden aspect-[3/4] ${viewMode === "spread" ? "max-w-md" : "max-w-2xl"} mx-auto book-right-page`}
          style={{
            boxShadow: "5px 5px 15px rgba(0, 0, 0, 0.1)",
            borderLeft: viewMode === "spread" && currentPage > 0 ? "1px solid #e0e0e0" : "none"
          }}
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
                // Cover page - enhanced for children's book look
                <div className="flex flex-col h-full bg-gradient-to-b from-pink-100 to-purple-100 relative">
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-0 left-0 w-full h-12 bg-yellow-200 rounded-b-full transform -translate-y-6"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-100 rounded-full transform translate-x-12 translate-y-12"></div>
                    <div className="absolute top-20 right-5 w-8 h-8 bg-pink-200 rounded-full"></div>
                    <div className="absolute bottom-40 left-5 w-12 h-12 bg-green-100 rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 relative overflow-hidden z-10">
                    <img 
                      src={storyData.coverImageUrl} 
                      alt="Capa da história" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white opacity-80"></div>
                  </div>
                  
                  <div className="p-8 text-center relative z-10 bg-white bg-opacity-80">
                    <h1 className="text-3xl font-bold mb-4 text-purple-700 font-playfair">
                      {storyData.title}
                    </h1>
                    
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-300 shadow-lg">
                        <img 
                          src={storyData.childImage} 
                          alt={storyData.childName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <p className="text-lg">
                      Uma história mágica sobre<br />
                      <span className="font-bold text-xl text-blue-600">{storyData.childName}</span>
                    </p>
                    
                    <div className="mt-4 text-sm text-slate-500">
                      Criado com StorySnap
                    </div>
                  </div>
                </div>
              ) : (
                // Story pages - enhanced for children's book look
                <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 w-8 h-8 bg-yellow-100 rounded-full opacity-50"></div>
                  <div className="absolute bottom-12 left-3 w-10 h-10 bg-pink-100 rounded-full opacity-50"></div>
                  
                  <div className="flex-1 relative p-4">
                    <div className="absolute inset-0 rounded-t-lg overflow-hidden">
                      <img 
                        src={storyData.pages[currentPage - 1].imageUrl} 
                        alt={`Ilustração da página ${currentPage}`} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white opacity-70"></div>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-white bg-opacity-90 rounded-t-3xl -mt-6 relative z-10 min-h-[40%] flex flex-col">
                    <div className="absolute top-0 left-1/2 w-20 h-1 bg-gray-200 rounded-full transform -translate-x-1/2 -translate-y-2"></div>
                    
                    <p className="text-lg leading-relaxed font-medium text-slate-800 flex-1 mt-4">
                      {storyData.pages[currentPage - 1].text}
                    </p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        {currentPage}
                      </div>
                      
                      <div className="text-sm text-slate-400">
                        Página {currentPage} de {totalPages - 1}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className="flex items-center gap-2 rounded-full px-6"
        >
          <ChevronLeft size={18} />
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-full"
          >
            <Home size={18} />
            Início
          </Button>
          
          <Button
            variant="default"
            onClick={generatePDF}
            disabled={isPdfGenerating}
            className="flex items-center gap-2 rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Download size={18} />
            {isPdfGenerating ? "Gerando..." : "Baixar Livro PDF"}
          </Button>
          
          <Button
            variant="ghost"
            onClick={toggleViewMode}
            className="flex items-center gap-2 rounded-full"
            title={viewMode === "single" ? "Ver como livro aberto" : "Ver página única"}
          >
            <BookOpen size={18} />
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-2 rounded-full px-6"
        >
          Próxima
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default StoryViewer;
