
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

// Function to get a random pastel color
const getRandomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 100%, 90%)`;
};

// Function to get a vibrant color for children's book
const getVibrantColor = (index: number) => {
  const colors = [
    '#FF9AA2', // soft pink
    '#FFB7B2', // light pink
    '#FFDAC1', // peach
    '#E2F0CB', // light green
    '#B5EAD7', // mint
    '#C7CEEA', // lavender
    '#FBE7C6', // light yellow
    '#F0E6EF', // light purple
    '#A2D2FF', // light blue
    '#FFCFD2', // blush
  ];
  return colors[index % colors.length];
};

const StoryViewer = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "spread">("single");
  const [pageColors, setPageColors] = useState<string[]>([]);
  
  // Load story data from session storage
  useEffect(() => {
    const data = sessionStorage.getItem("storyData");
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setStoryData(parsedData);
        
        // Generate a random pastel color for each page
        const colors = Array(parsedData.pages.length + 1)
          .fill(0)
          .map((_, i) => getVibrantColor(i));
        setPageColors(colors);
      } catch (error) {
        console.error("Error parsing story data:", error);
      }
    }
    setLoading(false);
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-storysnap-blue"></div>
      </div>
    );
  }
  
  if (!storyData) {
    return (
      <div className="text-center py-12 font-comic">
        <h2 className="text-3xl font-bold mb-4 text-purple-600">Nenhuma história encontrada</h2>
        <div className="mb-6">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4 text-muted-foreground">
            <path d="M12 21V12M12 12V3M12 12H21M12 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="mb-8 text-lg text-muted-foreground">
          Parece que você ainda não criou uma história. Que tal criar uma agora?
        </p>
        <Button onClick={() => navigate("/create-story")} className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-6 text-xl">
          Criar História Mágica
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
  
  // Enhanced PDF generation with children's book-like formatting
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
      const coverColor = getVibrantColor(0);
      pdf.setFillColor(parseInt(coverColor.slice(1, 3), 16), parseInt(coverColor.slice(3, 5), 16), parseInt(coverColor.slice(5, 7), 16));
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
        
        // Add a colorful background for each page
        const pageColor = getVibrantColor(i);
        pdf.setFillColor(parseInt(pageColor.slice(1, 3), 16), parseInt(pageColor.slice(3, 5), 16), parseInt(pageColor.slice(5, 7), 16));
        pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
        
        // Add decorative border
        pdf.setDrawColor(100, 100, 255);
        pdf.setLineWidth(2);
        pdf.roundedRect(5, 5, pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 10, 5, 5, 'S');
        
        // Add a fun pattern along the top of the page
        for (let j = 10; j < pdf.internal.pageSize.getWidth() - 10; j += 10) {
          pdf.setFillColor(255, 255, 255);
          pdf.circle(j, 10, 3, 'F');
        }
        
        // Add page number in a fun bubble
        pdf.setFillColor(255, 255, 100);
        pdf.circle(pdf.internal.pageSize.getWidth() - 15, pdf.internal.pageSize.getHeight() - 15, 10, 'F');
        pdf.setTextColor(100, 60, 20);
        pdf.setFontSize(12);
        pdf.text(i.toString(), pdf.internal.pageSize.getWidth() - 15, pdf.internal.pageSize.getHeight() - 12, { align: 'center' });
        
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
      const endColor = getVibrantColor(totalPages);
      pdf.setFillColor(parseInt(endColor.slice(1, 3), 16), parseInt(endColor.slice(3, 5), 16), parseInt(endColor.slice(5, 7), 16));
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
      
      // Add decorative frame
      pdf.setDrawColor(255, 100, 100);
      pdf.setLineWidth(3);
      pdf.roundedRect(10, 10, pdf.internal.pageSize.getWidth() - 20, pdf.internal.pageSize.getHeight() - 20, 10, 10, 'S');
      
      // Add stars to the corners
      const drawStar = (x: number, y: number, size: number) => {
        pdf.setFillColor(255, 220, 0);
        pdf.setDrawColor(255, 180, 0);
        
        const points = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        const startAngle = -Math.PI / 2;
        const angleStep = Math.PI / points;
        
        let path = '';
        
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = startAngle + i * angleStep;
          const xPoint = x + radius * Math.cos(angle);
          const yPoint = y + radius * Math.sin(angle);
          
          if (i === 0) {
            path = `${xPoint} ${yPoint} m `;
          } else {
            path += `${xPoint} ${yPoint} l `;
          }
        }
        
        path += 'h';
        
        // Note: PDF.js doesn't have a direct API for complex paths
        // This is a simplified approach - in reality you'd need a library
        // that can handle SVG paths in PDFs
        
        // Instead, let's draw a simple circle as a fallback
        pdf.circle(x, y, size, 'FD');
      };
      
      drawStar(25, 25, 8);
      drawStar(pdf.internal.pageSize.getWidth() - 25, 25, 8);
      drawStar(25, pdf.internal.pageSize.getHeight() - 25, 8);
      drawStar(pdf.internal.pageSize.getWidth() - 25, pdf.internal.pageSize.getHeight() - 25, 8);
      
      // Add "The End" text
      pdf.setFontSize(36);
      pdf.setTextColor(50, 50, 150);
      
      // Center the text
      const text = "Fim";
      const textWidth = pdf.getStringUnitWidth(text) * 36 / pdf.internal.scaleFactor;
      const textX = (pdf.internal.pageSize.getWidth() - textWidth) / 2;
      const textY = pdf.internal.pageSize.getHeight() / 2;
      
      pdf.text(text, textX, textY);
      
      // Add a small note with the app name
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      const appNote = "Criado com StorySnap ❤️";
      const noteWidth = pdf.getStringUnitWidth(appNote) * 12 / pdf.internal.scaleFactor;
      pdf.text(appNote, (pdf.internal.pageSize.getWidth() - noteWidth) / 2, pdf.internal.pageSize.getHeight() - 15);
      
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
        <div className="bg-white rounded-full shadow-md p-1 flex rainbow-border">
          <Button
            variant={viewMode === "single" ? "default" : "ghost"}
            onClick={() => setViewMode("single")}
            className="rounded-full font-comic text-base"
            size="sm"
          >
            Página Única
          </Button>
          <Button
            variant={viewMode === "spread" ? "default" : "ghost"}
            onClick={() => setViewMode("spread")}
            className="rounded-full font-comic text-base"
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
              borderRight: "1px solid #e0e0e0",
              backgroundColor: pageColors[Math.max(0, currentPage - 1)]
            }}
          >
            <div className="h-full p-6 flex flex-col justify-center items-center text-center bg-doodle-pattern">
              <p className="text-lg text-slate-500 font-patrick">
                {currentPage > 1 ? `Página ${currentPage - 1}` : ""}
              </p>
            </div>
          </div>
        )}
        
        <div 
          id="story-container" 
          className={`bg-white ${viewMode === "spread" ? (currentPage === 0 ? "rounded-2xl" : "rounded-r-2xl") : "rounded-2xl"} shadow-xl overflow-hidden aspect-[3/4] ${viewMode === "spread" ? "max-w-md" : "max-w-2xl"} mx-auto book-right-page book-paper-texture corner-curl`}
          style={{
            boxShadow: "5px 5px 15px rgba(0, 0, 0, 0.1)",
            borderLeft: viewMode === "spread" && currentPage > 0 ? "1px solid #e0e0e0" : "none",
            backgroundColor: pageColors[currentPage]
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
                <div className="flex flex-col h-full relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-stars-pattern"></div>
                  <div className="absolute top-0 left-0 w-full h-full">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-full h-16 bg-yellow-300 rounded-b-full transform -translate-y-8"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-200 rounded-full transform translate-x-16 translate-y-16"></div>
                    <div className="absolute top-20 right-5 w-10 h-10 bg-pink-300 rounded-full"></div>
                    <div className="absolute bottom-40 left-5 w-16 h-16 bg-green-200 rounded-full"></div>
                    
                    {/* Rainbow element */}
                    <div className="absolute top-40 left-0 right-0 h-32 opacity-20"
                      style={{
                        background: "linear-gradient(180deg, #FF5E78, #FFBD6D, #FFF46E, #77DD77, #92D2F7, #C199F5)",
                        borderRadius: "100% 100% 0 0"
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex-1 relative overflow-hidden z-10 border-b-8 border-dashed border-yellow-400">
                    <img 
                      src={storyData.coverImageUrl} 
                      alt="Capa da história" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white opacity-80"></div>
                  </div>
                  
                  <div className="p-8 text-center relative z-10 bg-white bg-opacity-90">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-blue-600 font-bubblegum">
                      {storyData.title}
                    </h1>
                    
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-300 shadow-lg">
                        <img 
                          src={storyData.childImage} 
                          alt={storyData.childName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <p className="text-xl font-patrick">
                      Uma história mágica sobre<br />
                      <span className="font-bold text-2xl text-purple-600 font-schoolbell">{storyData.childName}</span>
                    </p>
                    
                    <div className="mt-4 text-sm text-slate-500 font-comic">
                      Criado com StorySnap ✨
                    </div>
                  </div>
                </div>
              ) : (
                // Story pages - enhanced for children's book look
                <div className="flex flex-col h-full">
                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 w-10 h-10 bg-yellow-200 rounded-full opacity-60"></div>
                  <div className="absolute bottom-12 left-3 w-12 h-12 bg-pink-200 rounded-full opacity-60"></div>
                  
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
                  
                  <div className="p-6 bg-white bg-opacity-90 rounded-t-3xl -mt-6 relative z-10 min-h-[45%] flex flex-col">
                    <div className="absolute top-0 left-1/2 w-20 h-1 bg-gray-200 rounded-full transform -translate-x-1/2 -translate-y-2"></div>
                    
                    <p className="text-xl leading-relaxed font-medium text-slate-800 flex-1 mt-4 font-comic">
                      {storyData.pages[currentPage - 1].text}
                    </p>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="fun-page-number font-schoolbell">
                        {currentPage}
                      </div>
                      
                      <div className="text-base text-slate-500 font-patrick">
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
          className="flex items-center gap-2 rounded-full px-6 font-comic border-2 border-purple-300"
        >
          <ChevronLeft size={18} />
          Anterior
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 rounded-full font-comic"
          >
            <Home size={18} />
            Início
          </Button>
          
          <Button
            variant="default"
            onClick={generatePDF}
            disabled={isPdfGenerating}
            className="flex items-center gap-2 rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-bubblegum"
          >
            <Download size={18} />
            {isPdfGenerating ? "Gerando..." : "Baixar Livro PDF"}
          </Button>
          
          <Button
            variant="ghost"
            onClick={toggleViewMode}
            className="flex items-center gap-2 rounded-full font-comic"
            title={viewMode === "single" ? "Ver como livro aberto" : "Ver página única"}
          >
            <BookOpen size={18} />
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="flex items-center gap-2 rounded-full px-6 font-comic border-2 border-purple-300"
        >
          Próxima
          <ChevronRight size={18} />
        </Button>
      </div>
    </div>
  );
};

export default StoryViewer;
