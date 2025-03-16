
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Home, BookOpen, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

// Fontes infantis para o livro
const BOOK_FONTS = {
  title: "font-bubblegum",
  text: "font-comic",
  secondary: "font-patrick",
  accent: "font-schoolbell"
};

// Cores vibrantes infantis
const VIBRANT_COLORS = [
  '#FFB6C1', // pink
  '#FFD700', // gold
  '#98FB98', // palegreen
  '#87CEFA', // lightskyblue
  '#FFA07A', // lightsalmon
  '#DDA0DD', // plum
  '#FFFACD', // lemonchiffon
  '#B0E0E6', // powderblue
  '#FFDAB9', // peachpuff
  '#E6E6FA', // lavender
];

const getVibrantColor = (index: number) => {
  return VIBRANT_COLORS[index % VIBRANT_COLORS.length];
};

const StoryViewer = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "spread" | "carousel">("single");
  const [pageColors, setPageColors] = useState<string[]>([]);
  
  // Load story data from session storage
  useEffect(() => {
    const data = sessionStorage.getItem("storyData");
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setStoryData(parsedData);
        
        // Generate a vibrant color for each page
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
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
  
  // PDF generation using pdf-lib
  const generatePDF = async () => {
    try {
      setIsPdfGenerating(true);
      toast.info("Gerando seu livro infantil. Isso pode levar alguns instantes...");
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Embed a standard font - we'll use this as fallback
      const defaultFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
      
      // Function to add page with background color
      const addColoredPage = (color: string) => {
        const page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();
        
        // Convert hex to rgb for pdf-lib
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        
        // Draw background
        page.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: height,
          color: rgb(r, g, b),
          opacity: 0.3,
        });
        
        // Add decorative border
        page.drawRectangle({
          x: 20,
          y: 20,
          width: width - 40,
          height: height - 40,
          borderWidth: 2,
          borderColor: rgb(0.3, 0.3, 0.9),
          opacity: 0.8,
          borderOpacity: 0.8,
        });
        
        return page;
      };
      
      // Capture the story container current state for each page
      const storyContainer = document.getElementById('story-container');
      if (!storyContainer) {
        throw new Error("Elemento da história não encontrado");
      }
      
      // Save current page index
      const originalPage = currentPage;
      
      // Add Cover Page
      setCurrentPage(0);
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
      const coverPage = addColoredPage(pageColors[0]);
      const { width: coverWidth, height: coverHeight } = coverPage.getSize();
      
      // Add title
      coverPage.drawText(storyData.title, {
        x: 50,
        y: coverHeight - 100,
        size: 36,
        font: defaultFont,
        color: rgb(0.1, 0.1, 0.7),
      });
      
      // Add subtitle
      coverPage.drawText(`Uma história sobre ${storyData.childName}`, {
        x: 50,
        y: coverHeight - 150,
        size: 24,
        font: defaultFont,
        color: rgb(0.3, 0.1, 0.5),
      });
      
      // Capture cover image
      const coverCanvas = await html2canvas(storyContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const coverJpg = coverCanvas.toDataURL('image/jpeg', 0.95);
      const coverImage = await pdfDoc.embedJpg(await (await fetch(coverJpg)).arrayBuffer());
      
      // Calculate dimensions to center the image
      const coverImgWidth = 400;
      const coverImgHeight = (coverCanvas.height * coverImgWidth) / coverCanvas.width;
      
      // Draw cover image
      coverPage.drawImage(coverImage, {
        x: (coverWidth - coverImgWidth) / 2,
        y: (coverHeight - coverImgHeight) / 2,
        width: coverImgWidth,
        height: coverImgHeight,
      });
      
      // Add a footer with app name
      coverPage.drawText('Criado com StorySnap ✨', {
        x: 50,
        y: 50,
        size: 14,
        font: defaultFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Add Content Pages
      for (let i = 1; i < totalPages; i++) {
        setCurrentPage(i);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for render
        
        const contentPage = addColoredPage(pageColors[i]);
        const { width: pageWidth, height: pageHeight } = contentPage.getSize();
        
        // Add page number in a fun bubble
        contentPage.drawCircle({
          x: pageWidth - 30,
          y: 30,
          size: 20,
          color: rgb(1, 0.8, 0.2),
        });
        
        contentPage.drawText(i.toString(), {
          x: pageWidth - 34,
          y: 24,
          size: 16,
          font: defaultFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        // Capture the page content
        const pageCanvas = await html2canvas(storyContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });
        
        const pageJpg = pageCanvas.toDataURL('image/jpeg', 0.95);
        const pageImage = await pdfDoc.embedJpg(await (await fetch(pageJpg)).arrayBuffer());
        
        // Calculate dimensions to fit within the page with proper margins
        const pageImgWidth = pageWidth - 100;
        const pageImgHeight = (pageCanvas.height * pageImgWidth) / pageCanvas.width;
        
        // Draw page image
        contentPage.drawImage(pageImage, {
          x: 50,
          y: pageHeight - 100 - pageImgHeight,
          width: pageImgWidth,
          height: pageImgHeight,
        });
        
        // Draw the story text directly (as backup if image doesn't capture it well)
        contentPage.drawText(storyData.pages[i-1].text, {
          x: 50,
          y: 150,
          size: 14,
          font: defaultFont,
          color: rgb(0, 0, 0),
          maxWidth: pageWidth - 100,
          lineHeight: 18,
        });
      }
      
      // Add "The End" Page
      const endPage = addColoredPage('#FFFACD'); // Lemon chiffon color
      const { width: endWidth, height: endHeight } = endPage.getSize();
      
      // Add decorative elements
      endPage.drawCircle({
        x: 100,
        y: endHeight - 100,
        size: 30,
        color: rgb(1, 0.7, 0.8),
      });
      
      endPage.drawCircle({
        x: endWidth - 100,
        y: endHeight - 100,
        size: 30,
        color: rgb(0.7, 0.8, 1),
      });
      
      endPage.drawCircle({
        x: 100,
        y: 100,
        size: 30,
        color: rgb(0.8, 1, 0.7),
      });
      
      endPage.drawCircle({
        x: endWidth - 100,
        y: 100,
        size: 30,
        color: rgb(1, 0.8, 0.4),
      });
      
      // Add "The End" text
      endPage.drawText('Fim', {
        x: endWidth / 2 - 50,
        y: endHeight / 2,
        size: 48,
        font: defaultFont,
        color: rgb(0.3, 0.1, 0.6),
      });
      
      // Add a note with the app name
      endPage.drawText('Criado com StorySnap ❤️', {
        x: endWidth / 2 - 100,
        y: 30,
        size: 16,
        font: defaultFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      // Save the PDF and offer it for download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${storyData.title.replace(/[^a-zA-Z0-9áàâãéèêíïóôõöúçñ]/g, '_')}.pdf`;
      link.click();
      
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
  
  // Toggle between view modes
  const toggleViewMode = () => {
    if (viewMode === "single") {
      setViewMode("spread");
    } else if (viewMode === "spread") {
      setViewMode("carousel");
    } else {
      setViewMode("single");
    }
  };
  
  // Render the correct view based on viewMode
  const renderBookView = () => {
    if (viewMode === "carousel") {
      return (
        <div className="w-full max-w-4xl mx-auto">
          <Carousel>
            <CarouselContent>
              {/* Cover Page */}
              <CarouselItem>
                <div 
                  className="h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden"
                  style={{ backgroundColor: pageColors[0] }}
                >
                  <CoverPage storyData={storyData} />
                </div>
              </CarouselItem>
              
              {/* Content Pages */}
              {storyData.pages.map((page, index) => (
                <CarouselItem key={index}>
                  <div 
                    className="h-[600px] bg-white rounded-2xl shadow-xl overflow-hidden"
                    style={{ backgroundColor: pageColors[index + 1] }}
                  >
                    <ContentPage 
                      page={page}
                      pageNumber={index + 1}
                      totalPages={totalPages - 1}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-4">
              <CarouselPrevious className="relative static mr-2 left-0 translate-y-0" />
              <CarouselNext className="relative static ml-2 right-0 translate-y-0" />
            </div>
          </Carousel>
        </div>
      );
    }
    
    return (
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
              <p className={`text-lg text-slate-500 ${BOOK_FONTS.secondary}`}>
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
                <CoverPage storyData={storyData} />
              ) : (
                <ContentPage 
                  page={storyData.pages[currentPage - 1]}
                  pageNumber={currentPage}
                  totalPages={totalPages - 1}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };
  
  // Cover page component
  const CoverPage = ({ storyData }: { storyData: StoryData }) => {
    return (
      <div className="flex flex-col h-full relative">
        <div className="absolute top-0 left-0 w-full h-full bg-stars-pattern"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-20 bg-yellow-300 rounded-b-full transform -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-blue-200 rounded-full transform translate-x-20 translate-y-20"></div>
          <div className="absolute top-20 right-5 w-12 h-12 bg-pink-300 rounded-full"></div>
          <div className="absolute bottom-40 left-5 w-20 h-20 bg-green-200 rounded-full"></div>
          
          {/* Rainbow element */}
          <div className="absolute top-1/3 left-0 right-0 h-40 opacity-30"
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
          <h1 className={`text-3xl md:text-4xl font-bold mb-4 text-blue-600 ${BOOK_FONTS.title}`}>
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
          
          <p className={`text-xl ${BOOK_FONTS.secondary}`}>
            Uma história mágica sobre<br />
            <span className={`font-bold text-2xl text-purple-600 ${BOOK_FONTS.accent}`}>{storyData.childName}</span>
          </p>
          
          <div className="mt-4 text-sm text-slate-500 font-comic">
            Criado com StorySnap ✨
          </div>
        </div>
      </div>
    );
  };
  
  // Content page component
  const ContentPage = ({ page, pageNumber, totalPages }: { page: StoryPage, pageNumber: number, totalPages: number }) => {
    return (
      <div className="flex flex-col h-full">
        {/* Decorative elements */}
        <div className="absolute top-3 right-3 w-12 h-12 bg-yellow-200 rounded-full opacity-60"></div>
        <div className="absolute bottom-14 left-4 w-14 h-14 bg-pink-200 rounded-full opacity-60"></div>
        
        <div className="flex-1 relative p-5">
          <div className="absolute inset-0 rounded-t-lg overflow-hidden">
            <img 
              src={page.imageUrl} 
              alt={`Ilustração da página ${pageNumber}`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white opacity-70"></div>
          </div>
        </div>
        
        <div className="p-6 bg-white bg-opacity-95 rounded-t-3xl -mt-6 relative z-10 min-h-[45%] flex flex-col">
          <div className="absolute top-0 left-1/2 w-20 h-1 bg-gray-200 rounded-full transform -translate-x-1/2 -translate-y-2"></div>
          
          <p className={`text-xl leading-relaxed font-medium text-slate-800 flex-1 mt-4 ${BOOK_FONTS.text}`}>
            {page.text}
          </p>
          
          <div className="flex justify-between items-center mt-4">
            <div className={`fun-page-number ${BOOK_FONTS.accent}`}>
              {pageNumber}
            </div>
            
            <div className={`text-base text-slate-500 ${BOOK_FONTS.secondary}`}>
              Página {pageNumber} de {totalPages}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative">
      {/* View Mode Selector */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full shadow-md p-1 flex rainbow-border">
          <Button
            variant={viewMode === "single" ? "default" : "ghost"}
            onClick={() => setViewMode("single")}
            className={`rounded-full text-base ${BOOK_FONTS.comic}`}
            size="sm"
          >
            Página Única
          </Button>
          <Button
            variant={viewMode === "spread" ? "default" : "ghost"}
            onClick={() => setViewMode("spread")}
            className={`rounded-full text-base ${BOOK_FONTS.comic}`}
            size="sm"
          >
            Livro Aberto
          </Button>
          <Button
            variant={viewMode === "carousel" ? "default" : "ghost"}
            onClick={() => setViewMode("carousel")}
            className={`rounded-full text-base ${BOOK_FONTS.comic}`}
            size="sm"
          >
            Carrossel
          </Button>
        </div>
      </div>
      
      {/* Book View Container */}
      {renderBookView()}
      
      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-8">
        {viewMode !== "carousel" && (
          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            className={`flex items-center gap-2 rounded-full px-6 border-2 border-purple-300 ${BOOK_FONTS.comic}`}
          >
            <ChevronLeft size={18} />
            Anterior
          </Button>
        )}
        
        <div className={`flex gap-2 ${viewMode === "carousel" ? "mx-auto" : ""}`}>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 rounded-full ${BOOK_FONTS.comic}`}
          >
            <Home size={18} />
            Início
          </Button>
          
          <Button
            variant="default"
            onClick={generatePDF}
            disabled={isPdfGenerating}
            className={`flex items-center gap-2 rounded-full px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 ${BOOK_FONTS.title}`}
          >
            <Download size={18} />
            {isPdfGenerating ? "Gerando..." : "Baixar Livro PDF"}
          </Button>
          
          {viewMode !== "carousel" && (
            <Button
              variant="ghost"
              onClick={toggleViewMode}
              className={`flex items-center gap-2 rounded-full ${BOOK_FONTS.comic}`}
              title="Mudar visualização"
            >
              <Wand2 size={18} />
            </Button>
          )}
        </div>
        
        {viewMode !== "carousel" && (
          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            className={`flex items-center gap-2 rounded-full px-6 border-2 border-purple-300 ${BOOK_FONTS.comic}`}
          >
            Próxima
            <ChevronRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
