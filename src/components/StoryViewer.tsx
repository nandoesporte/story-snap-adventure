
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { DownloadIcon, ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, SplitIcon, LayoutGridIcon } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

// Define the font types with proper comic property
type FontOption = {
  title: string;
  text: string;
  secondary: string;
  accent: string;
  comic: string; // Adding the missing comic property
};

// Define the story data structure
interface StoryData {
  title: string;
  coverImageUrl: string;
  childImage: string;
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
  pages: Array<{
    text: string;
    imageUrl: string;
  }>;
}

// Properly define ViewMode as a union of string literals
type ViewMode = "single" | "spread" | "carousel";

const StoryViewer = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Explicitly type the viewMode state with the ViewMode type
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const storyBookRef = useRef<HTMLDivElement>(null);
  
  // Define font styles with comic property
  const fonts: Record<string, FontOption> = {
    bubblegum: {
      title: "font-bubblegum",
      text: "font-bubblegum",
      secondary: "font-comic",
      accent: "font-patrick",
      comic: "Bubblegum Sans"
    },
    schoolbell: {
      title: "font-schoolbell",
      text: "font-patrick",
      secondary: "font-comic",
      accent: "font-bubblegum",
      comic: "Schoolbell"
    },
    patrick: {
      title: "font-patrick",
      text: "font-schoolbell",
      secondary: "font-bubblegum",
      accent: "font-comic", 
      comic: "Patrick Hand"
    },
    comic: {
      title: "font-comic",
      text: "font-comic",
      secondary: "font-schoolbell",
      accent: "font-patrick",
      comic: "Comic Neue"
    }
  };
  
  // Define fun colors for children's book
  const colors = [
    "bg-amber-50 from-amber-50 to-orange-50",
    "bg-sky-50 from-sky-50 to-blue-50",
    "bg-rose-50 from-rose-50 to-pink-50",
    "bg-lime-50 from-lime-50 to-green-50",
    "bg-violet-50 from-violet-50 to-purple-50",
    "bg-yellow-50 from-yellow-50 to-amber-50",
    "bg-teal-50 from-teal-50 to-emerald-50",
    "bg-blue-50 from-blue-50 to-indigo-50",
    "bg-orange-50 from-orange-50 to-red-50",
    "bg-fuchsia-50 from-fuchsia-50 to-pink-50"
  ];
  
  // Load story data from session storage on component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("storyData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setStoryData(parsedData);
    }
  }, []);
  
  // Function to navigate to the previous page
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Function to navigate to the next page
  const nextPage = () => {
    const maxPages = storyData ? storyData.pages.length + 1 : 1; // +1 for cover
    if (currentPage < maxPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Function to generate book cover
  const renderBookCover = () => {
    if (!storyData) return null;
    
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-sky-100 to-indigo-100 rounded-2xl overflow-hidden">
        {/* Decorative elements for cover */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-5 left-5 w-20 h-20 bg-yellow-300 rounded-full opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-300 rounded-full opacity-20"></div>
          <div className="absolute top-1/3 right-5 w-16 h-16 bg-blue-300 rounded-full opacity-20"></div>
        </div>
        
        {/* Book title */}
        <div className="z-10 w-full text-center mt-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-indigo-800 font-bubblegum relative inline-block">
            <span className="relative z-10">{storyData.title}</span>
            <span className="absolute -bottom-2 left-0 right-0 h-4 bg-yellow-300 opacity-40 transform -rotate-1 rounded"></span>
          </h1>
        </div>
        
        {/* Cover image */}
        <div className="flex-1 flex items-center justify-center w-full my-6 relative">
          {storyData.coverImageUrl && (
            <img 
              src={storyData.coverImageUrl} 
              alt="Capa da história" 
              className="rounded-xl shadow-xl max-h-[400px] max-w-full object-contain"
            />
          )}
        </div>
        
        {/* Author attribution and child photo */}
        <div className="z-10 w-full flex flex-col items-center">
          <p className="text-xl font-comic text-indigo-700 mb-4">
            Uma história especial para {storyData.childName}
          </p>
          {storyData.childImage && (
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-md">
              <img 
                src={storyData.childImage} 
                alt={storyData.childName} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Function to render a single story page
  const renderStoryPage = (pageIndex: number) => {
    if (!storyData || pageIndex >= storyData.pages.length) return null;
    
    const page = storyData.pages[pageIndex];
    const fontStyle = Object.values(fonts)[pageIndex % Object.values(fonts).length];
    const colorStyle = colors[pageIndex % colors.length];
    
    return (
      <div className={`relative w-full h-full flex flex-col p-6 ${colorStyle} bg-gradient-to-b rounded-2xl overflow-hidden`}>
        {/* Page number */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">
          <span className="text-sm font-bold">{pageIndex + 1}</span>
        </div>
        
        {/* Text content with decorative elements */}
        <div className="flex flex-col md:flex-row gap-6 h-full">
          <div className="flex-1 flex flex-col justify-center">
            <p className={`${fontStyle.text} text-lg md:text-xl leading-relaxed mb-6 text-slate-800 relative`}>
              {page.text}
            </p>
            
            {/* Decorative element */}
            <div className="absolute bottom-6 left-6 w-12 h-12 bg-amber-200 rounded-full opacity-40 blur-sm"></div>
          </div>
          
          {/* Page illustration */}
          <div className="flex-1 flex items-center justify-center">
            {page.imageUrl && (
              <img 
                src={page.imageUrl} 
                alt={`Ilustração página ${pageIndex + 1}`} 
                className="rounded-xl shadow-lg max-h-[300px] max-w-full object-contain border-4 border-white"
              />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Function to generate a PDF of the storybook
  const generatePdf = async () => {
    if (!storyData) return;
    
    setIsPdfGenerating(true);
    
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add cover page
      const coverPage = pdfDoc.addPage([600, 800]);
      
      // Add story title
      coverPage.drawText(storyData.title, {
        x: 50,
        y: 750,
        size: 36,
        color: rgb(0.1, 0.1, 0.7),
      });
      
      // Add "special story for [childName]" text
      coverPage.drawText(`Uma história especial para ${storyData.childName}`, {
        x: 50,
        y: 700,
        size: 18,
        color: rgb(0.3, 0.3, 0.7),
      });
      
      // Fetch and embed the cover image
      try {
        const coverImageBytes = await fetch(storyData.coverImageUrl).then(res => res.arrayBuffer());
        const coverImage = await pdfDoc.embedPng(coverImageBytes);
        const coverDims = coverImage.scale(0.5);
        
        coverPage.drawImage(coverImage, {
          x: 50,
          y: 350,
          width: 500,
          height: 300,
        });
      } catch (err) {
        console.error("Error embedding cover image:", err);
      }
      
      // Add story pages
      for (let i = 0; i < storyData.pages.length; i++) {
        const page = storyData.pages[i];
        const storyPage = pdfDoc.addPage([600, 800]);
        
        // Add page number
        storyPage.drawText(`${i + 1}`, {
          x: 550,
          y: 750,
          size: 24,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        // Add page text using word wrapping approach
        const words = page.text.split(' ');
        let line = '';
        let y = 700;
        
        for (let word of words) {
          const testLine = line + word + ' ';
          
          // If the line gets too long, draw it and start a new line
          if (testLine.length > 60) {
            storyPage.drawText(line, {
              x: 50,
              y,
              size: 14,
              color: rgb(0.1, 0.1, 0.1),
            });
            line = word + ' ';
            y -= 20;
          } else {
            line = testLine;
          }
        }
        
        // Draw the last line
        if (line) {
          storyPage.drawText(line, {
            x: 50,
            y,
            size: 14,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        
        // Fetch and embed the page image
        try {
          const imageBytes = await fetch(page.imageUrl).then(res => res.arrayBuffer());
          const image = await pdfDoc.embedPng(imageBytes);
          
          storyPage.drawImage(image, {
            x: 50,
            y: 350,
            width: 500,
            height: 300,
          });
        } catch (err) {
          console.error(`Error embedding image for page ${i + 1}:`, err);
        }
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a download link for the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storyData.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsPdfGenerating(false);
    }
  };
  
  // If no story data is available, show a message
  if (!storyData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-slate-50 rounded-2xl">
        <div className="text-center">
          <BookOpenIcon className="mx-auto h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-500">Nenhuma história encontrada</h3>
          <p className="mt-2 text-slate-400">Crie uma história primeiro para visualizá-la aqui.</p>
        </div>
      </div>
    );
  }
  
  // Main render for Single Page mode
  if (viewMode === "single") {
    return (
      <div className="flex flex-col" ref={storyBookRef}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("single")}
              className={viewMode === "single" ? "bg-slate-200" : ""}
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Página</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("spread")}
              className={viewMode === "spread" ? "bg-slate-200" : ""}
            >
              <SplitIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Abertura</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("carousel")}
              className={viewMode === "carousel" ? "bg-slate-200" : ""}
            >
              <LayoutGridIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Carrossel</span>
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generatePdf}
            disabled={isPdfGenerating}
            className="ml-auto"
          >
            {isPdfGenerating ? (
              <>
                <LoadingSpinner size="sm" /> 
                <span className="ml-2">Gerando...</span>
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4 mr-1" />
                <span>Baixar PDF</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Book display with navigation */}
        <div className="relative rounded-2xl bg-white shadow-2xl overflow-hidden" style={{ minHeight: "600px" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
              style={{ minHeight: "600px" }}
            >
              {currentPage === 0 ? renderBookCover() : renderStoryPage(currentPage - 1)}
            </motion.div>
          </AnimatePresence>
          
          {/* Page navigation */}
          <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 transform -translate-y-1/2 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="rounded-full bg-white/80 shadow-md hover:bg-white pointer-events-auto"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextPage}
              disabled={currentPage === storyData.pages.length}
              className="rounded-full bg-white/80 shadow-md hover:bg-white pointer-events-auto"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Page number indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 px-3 py-1 rounded-full shadow text-sm font-medium">
            {currentPage === 0 ? 'Capa' : `Página ${currentPage} de ${storyData.pages.length}`}
          </div>
        </div>
      </div>
    );
  }
  
  // Render for Book Spread mode
  if (viewMode === "spread") {
    // Calculate pages for spread view (pairs of pages)
    const leftPage = Math.max(0, currentPage * 2 - 1);
    const rightPage = leftPage + 1;
    const maxPage = storyData.pages.length;
    
    return (
      <div className="flex flex-col" ref={storyBookRef}>
        <div className="flex justify-between items-center mb-4">
          {/* View mode toggles */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("single")}
              className={viewMode === "single" ? "bg-slate-200" : ""}
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Página</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("spread")}
              className={viewMode === "spread" ? "bg-slate-200" : ""}
            >
              <SplitIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Abertura</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("carousel")}
              className={viewMode === "carousel" ? "bg-slate-200" : ""}
            >
              <LayoutGridIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Carrossel</span>
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generatePdf}
            disabled={isPdfGenerating}
            className="ml-auto"
          >
            {isPdfGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Gerando...</span>
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4 mr-1" />
                <span>Baixar PDF</span>
              </>
            )}
          </Button>
        </div>
        
        {/* Book spread display with navigation */}
        <div className="flex bg-amber-800 p-4 rounded-2xl shadow-2xl" style={{ minHeight: "600px" }}>
          {/* Book spread */}
          <div className="flex flex-1 bg-gradient-to-r from-amber-50 to-amber-100" style={{ minHeight: "600px" }}>
            {/* Left page */}
            <div className="flex-1 p-4 border-r border-amber-300">
              {leftPage === 0 ? renderBookCover() : (leftPage <= maxPage ? renderStoryPage(leftPage - 1) : null)}
            </div>
            
            {/* Right page */}
            <div className="flex-1 p-4">
              {rightPage <= maxPage ? renderStoryPage(rightPage - 1) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-amber-700 font-bubblegum text-xl">Fim da História</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Spread navigation */}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <div className="px-3 py-1 bg-white border rounded-md">
            {currentPage} de {Math.ceil((maxPage + 1) / 2)}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(Math.ceil((maxPage + 1) / 2), currentPage + 1))}
            disabled={currentPage >= Math.ceil((maxPage + 1) / 2)}
          >
            Próximo
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }
  
  // Render for Carousel mode
  return (
    <div className="flex flex-col" ref={storyBookRef}>
      <div className="flex justify-between items-center mb-4">
        {/* View mode toggles */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("single")}
            className={viewMode === "single" ? "bg-slate-200" : ""}
          >
            <BookOpenIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Página</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("spread")}
            className={viewMode === "spread" ? "bg-slate-200" : ""}
          >
            <SplitIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Abertura</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("carousel")}
            className={viewMode === "carousel" ? "bg-slate-200" : ""}
          >
            <LayoutGridIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Carrossel</span>
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generatePdf}
          disabled={isPdfGenerating}
          className="ml-auto"
        >
          {isPdfGenerating ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Gerando...</span>
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4 mr-1" />
              <span>Baixar PDF</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Carousel pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cover */}
        <div className="rounded-2xl shadow-lg overflow-hidden h-96" onClick={() => setCurrentPage(0)}>
          <div className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity">
            {renderBookCover()}
          </div>
          <div className="bg-white py-1 text-center text-sm font-medium">Capa</div>
        </div>
        
        {/* Story pages */}
        {storyData.pages.map((_, index) => (
          <div 
            key={index}
            className="rounded-2xl shadow-lg overflow-hidden h-96"
            onClick={() => setCurrentPage(index + 1)}
          >
            <div className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity">
              {renderStoryPage(index)}
            </div>
            <div className="bg-white py-1 text-center text-sm font-medium">Página {index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryViewer;
