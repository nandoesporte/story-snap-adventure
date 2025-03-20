
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { DownloadIcon, ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, SplitIcon, LayoutGridIcon } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

// Define the font types with proper comic property
type FontOption = {
  title: string;
  text: string;
  secondary: string;
  accent: string;
  comic: string;
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

// Define ViewMode as a union type of string literals
type ViewMode = "single" | "spread" | "carousel";

const StoryViewer = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
  
  // Define fun colors for children's book pages
  const colors = [
    "from-amber-50 to-orange-50",
    "from-sky-50 to-blue-50",
    "from-rose-50 to-pink-50",
    "from-lime-50 to-green-50",
    "from-violet-50 to-purple-50",
    "from-yellow-50 to-amber-50",
    "from-teal-50 to-emerald-50",
    "from-blue-50 to-indigo-50",
    "from-orange-50 to-red-50",
    "from-fuchsia-50 to-pink-50"
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
      <div className="book-page book-cover">
        {/* Decorative elements for cover */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="bookworm absolute bottom-10 left-5 transform -rotate-12"></div>
          <div className="stars-pattern absolute inset-0 opacity-10"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-300 rounded-full opacity-20 blur-md"></div>
        </div>
        
        {/* Book title */}
        <div className="book-title">
          <h1>{storyData.title}</h1>
        </div>
        
        {/* Cover image */}
        <div className="book-cover-image">
          {storyData.coverImageUrl && (
            <img 
              src={storyData.coverImageUrl} 
              alt="Capa da história" 
            />
          )}
        </div>
        
        {/* Author attribution and child photo */}
        <div className="book-attribution">
          <p>
            Uma história especial para {storyData.childName}
          </p>
          {storyData.childImage && (
            <div className="child-photo">
              <img 
                src={storyData.childImage} 
                alt={storyData.childName} 
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
      <div className={`book-page ${fontStyle.text} bg-gradient-to-b ${colorStyle}`}>
        {/* Page number */}
        <div className="page-number">
          <span>{pageIndex + 1}</span>
        </div>
        
        {/* Text content with decorative elements */}
        <div className="page-content">
          <div className="page-text">
            <p>{page.text}</p>
            
            {/* Decorative element */}
            <div className="absolute bottom-6 left-6 w-12 h-12 bg-amber-200 rounded-full opacity-40 blur-sm"></div>
          </div>
          
          {/* Page illustration */}
          <div className="page-illustration">
            {page.imageUrl && (
              <img 
                src={page.imageUrl} 
                alt={`Ilustração página ${pageIndex + 1}`} 
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
    toast.info("Gerando PDF, por favor aguarde...");
    
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Create an HTML representation of each page to capture with html2canvas
      const pages = [renderBookCover()];
      storyData.pages.forEach((_, index) => {
        pages.push(renderStoryPage(index));
      });
      
      // Create a temporary container for rendering pages
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      // Process each page
      for (let i = 0; i < pages.length; i++) {
        if (!pages[i]) continue;
        
        // Create a wrapper with the same styling as our book
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-page-wrapper';
        wrapper.style.width = '800px';
        wrapper.style.height = '1100px';
        wrapper.style.backgroundColor = '#fff';
        wrapper.style.position = 'relative';
        wrapper.style.fontFamily = 'Comic Neue, Bubblegum Sans, Patrick Hand, Schoolbell, sans-serif';
        
        // Temporary render the page
        const root = document.createElement('div');
        root.style.width = '100%';
        root.style.height = '100%';
        root.style.padding = '40px';
        wrapper.appendChild(root);
        container.appendChild(wrapper);
        
        // Use ReactDOM to render the React component to the temporary container
        const ReactDOM = await import('react-dom/client');
        const tempRoot = ReactDOM.createRoot(root);
        tempRoot.render(pages[i]);
        
        // Wait a bit for rendering and images to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture the rendered page as an image
        const canvas = await html2canvas(wrapper, {
          scale: 1.5,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        // Convert canvas to PNG
        const pageImage = canvas.toDataURL('image/png');
        
        // Add a new page to the PDF (US Letter size)
        const page = pdfDoc.addPage([850, 1100]);
        
        // Embed the image
        const image = await pdfDoc.embedPng(pageImage);
        
        // Draw the image to fill the whole page
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: 850,
          height: 1100
        });
        
        // Clean up
        tempRoot.unmount();
        container.removeChild(wrapper);
      }
      
      // Clean up the container
      document.body.removeChild(container);
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a download link
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
        <div className="book-controls">
          <div className="view-modes">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("single")}
              className={viewMode === "single" ? "active-mode" : ""}
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Página</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("spread")}
              className={viewMode === "spread" ? "active-mode" : ""}
            >
              <SplitIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Abertura</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("carousel")}
              className={viewMode === "carousel" ? "active-mode" : ""}
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
            className="download-btn"
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
        <div className="book-display">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {currentPage === 0 ? renderBookCover() : renderStoryPage(currentPage - 1)}
            </motion.div>
          </AnimatePresence>
          
          {/* Page navigation */}
          <div className="page-navigation">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevPage}
              disabled={currentPage === 0}
              className="nav-button prev-button"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextPage}
              disabled={currentPage === storyData.pages.length}
              className="nav-button next-button"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Page indicator */}
          <div className="page-indicator">
            {currentPage === 0 ? 'Capa' : `Página ${currentPage} de ${storyData.pages.length}`}
          </div>
        </div>
        
        {/* Book styling */}
        <style>
          {`
          .book-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .view-modes {
            display: flex;
            gap: 0.5rem;
          }
          
          .active-mode {
            background-color: #e2e8f0;
          }
          
          .download-btn {
            margin-left: auto;
          }
          
          .book-display {
            position: relative;
            min-height: 600px;
            background: white;
            border-radius: 12px;
            box-shadow: 
              0 10px 30px rgba(0, 0, 0, 0.15),
              2px 2px 5px rgba(0, 0, 0, 0.05),
              -2px 0 5px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            padding: 0;
          }
          
          .book-page {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: 600px;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            border-radius: 12px;
            overflow: hidden;
          }
          
          .book-cover {
            background: linear-gradient(135deg, #9dc6f5 0%, #7c9eee 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
          }
          
          .book-title {
            text-align: center;
            margin-top: 2rem;
            z-index: 10;
          }
          
          .book-title h1 {
            font-family: 'Bubblegum Sans', cursive;
            font-size: 2.5rem;
            font-weight: bold;
            color: #fff;
            text-shadow: 2px 2px 0 #4a5568;
            line-height: 1.2;
            position: relative;
            display: inline-block;
          }
          
          .book-title h1:after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            right: 0;
            height: 6px;
            background-color: #ffd700;
            border-radius: 3px;
            opacity: 0.6;
            transform: rotate(-1deg);
          }
          
          .book-cover-image {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem 0;
            z-index: 5;
          }
          
          .book-cover-image img {
            max-height: 350px;
            max-width: 100%;
            object-fit: contain;
            border-radius: 8px;
            border: 8px solid white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            transform: rotate(-2deg);
          }
          
          .book-attribution {
            margin-bottom: 1.5rem;
            text-align: center;
            z-index: 10;
          }
          
          .book-attribution p {
            font-family: 'Comic Neue', cursive;
            font-size: 1.25rem;
            font-weight: bold;
            color: #fff;
            margin-bottom: 0.5rem;
            text-shadow: 1px 1px 0 #4a5568;
          }
          
          .child-photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            margin: 0 auto;
          }
          
          .child-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .page-number {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: white;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            z-index: 10;
          }
          
          .page-number span {
            font-weight: bold;
            font-size: 1rem;
            color: #4a5568;
          }
          
          .page-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            height: 100%;
            z-index: 5;
          }
          
          @media (min-width: 768px) {
            .page-content {
              flex-direction: row;
            }
          }
          
          .page-text {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
          }
          
          .page-text p {
            font-size: 1.25rem;
            line-height: 1.6;
            color: #2d3748;
            margin-bottom: 1.5rem;
            z-index: 5;
            background-color: rgba(255, 255, 255, 0.7);
            padding: 1rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            position: relative;
            border-left: 5px solid #7c9eee;
          }
          
          .page-illustration {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .page-illustration img {
            max-height: 350px;
            max-width: 100%;
            object-fit: contain;
            border-radius: 10px;
            border: 8px solid white;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            transform: rotate(1deg);
          }
          
          .page-navigation {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            padding: 0 1rem;
            transform: translateY(-50%);
            pointer-events: none;
            z-index: 20;
          }
          
          .nav-button {
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            pointer-events: auto;
            transition: transform 0.2s ease;
          }
          
          .nav-button:hover:not(:disabled) {
            transform: scale(1.1);
            background-color: white;
          }
          
          .nav-button:disabled {
            opacity: 0.5;
          }
          
          .page-indicator {
            position: absolute;
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(255, 255, 255, 0.8);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            z-index: 10;
          }
          
          /* Decorative elements */
          .stars-pattern {
            background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ctitle%3Estars%3C/title%3E%3Cg fill='%23FFD700' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M12 18l-4 2 1-4.75L5 11.5l5-.5L12 7l2 4 5 .5-4 3.75L16 20z'/%3E%3C/g%3E%3C/svg%3E");
          }
          
          .bookworm {
            width: 60px;
            height: 60px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234CAF50' d='M12,6c0,0-4-0.2-7,2c0,0,3.3,0.6,6,3c0,0,2.7-2.4,6-3C17,8,16.3,5.7,12,6z'/%3E%3Cpath fill='%238BC34A' d='M14,8c-3.3,0.6-6,3-6,3s0.3,0.2,0.8,0.6c0.7,0.4,1.7,1.3,2.2,1.5c0.8,0.4,2,0.7,3,0.7c1,0,2.5-0.4,3-0.6c0.7-0.4,1.2-1.1,1.7-1.7c0.4-0.5,0.6-0.7,1.3-1.5C18.3,8.7,17.3,8.6,14,8z'/%3E%3Cellipse fill='%23455A64' cx='14.5' cy='11' rx='1' ry='1'/%3E%3Cellipse fill='%23455A64' cx='17.5' cy='11' rx='1' ry='1'/%3E%3Cpath fill='%23D81B60' d='M16,13c-0.6,0-1,0.4-1,1v3c0,0.2,0,0.5,0.1,0.7c0,0,0.4,0.9,0.9,1.2c0.4,0.2,0.7,0.1,0.9,0.1c0.4,0,0.7-0.2,0.9-0.4c0.3-0.2,0.6-0.8,0.7-1c0.1-0.1,0.2-0.3,0.2-0.6c0-0.1,0.1-0.2,0.1-0.4l0-2.6c0-0.6-0.4-1-1-1H16z'/%3E%3Cpath fill='%23CFD8DC' d='M19.9,21c-0.5-0.4-2.8-1.9-3.9-1.9s-2.2,1.5-2.6,2.3c-0.2,0.5-0.4,0.5-0.8,0.5c-0.5,0-0.7-0.3-0.7-0.5C12,20.7,10,18,10,18s-1,0-1,2c0,1.6,0.8,2,2,2C12.8,22,17.9,22,19.9,21z'/%3E%3C/svg%3E");
            opacity: 0.5;
            z-index: 5;
          }
          
          /* The spread view styles */
          .book-spread {
            display: flex;
            background: #a87b51;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            min-height: 600px;
          }
          
          .book-left-page, .book-right-page {
            flex: 1;
            background: #fffbf0;
            margin: 0;
            box-shadow: inset 4px 0 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .book-left-page {
            border-right: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 10px 0 0 10px;
          }
          
          .book-right-page {
            border-left: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 0 10px 10px 0;
            box-shadow: inset -4px 0 10px rgba(0, 0, 0, 0.1);
          }
          
          .book-binding {
            width: 30px;
            background: linear-gradient(to right, #8c6239, #a87b51, #8c6239);
          }
          
          /* The carousel view styles */
          .carousel-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 1rem;
          }
          
          @media (min-width: 768px) {
            .carousel-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .carousel-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          .carousel-item {
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.2s ease;
            height: 400px;
          }
          
          .carousel-item:hover {
            transform: translateY(-5px);
          }
          
          .carousel-content {
            height: 100%;
            transition: opacity 0.2s ease;
          }
          
          .carousel-item:hover .carousel-content {
            opacity: 0.9;
          }
          
          .carousel-caption {
            background-color: white;
            padding: 0.5rem 0;
            text-align: center;
            font-weight: 500;
            font-size: 0.875rem;
            border-top: 1px solid #e2e8f0;
          }
          
          /* PDF styling */
          .pdf-page-wrapper {
            box-sizing: border-box;
            font-family: 'Comic Neue', 'Bubblegum Sans', 'Patrick Hand', 'Schoolbell', sans-serif;
          }
        `}
        </style>
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
        <div className="book-controls">
          <div className="view-modes">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("single")}
              className={viewMode === "single" ? "active-mode" : ""}
            >
              <BookOpenIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Página</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("spread")}
              className={viewMode === "spread" ? "active-mode" : ""}
            >
              <SplitIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Abertura</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setViewMode("carousel")}
              className={viewMode === "carousel" ? "active-mode" : ""}
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
            className="download-btn"
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
        
        {/* Book spread display */}
        <div className="book-spread">
          {/* Left page */}
          <div className="book-left-page">
            {leftPage === 0 ? renderBookCover() : (leftPage <= maxPage ? renderStoryPage(leftPage - 1) : null)}
          </div>
          
          {/* Book binding */}
          <div className="book-binding"></div>
          
          {/* Right page */}
          <div className="book-right-page">
            {rightPage <= maxPage ? renderStoryPage(rightPage - 1) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-amber-700 font-bubblegum text-xl">Fim da História</p>
              </div>
            )}
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
      <div className="book-controls">
        <div className="view-modes">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("single")}
            className={viewMode === "single" ? "active-mode" : ""}
          >
            <BookOpenIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Página</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("spread")}
            className={viewMode === "spread" ? "active-mode" : ""}
          >
            <SplitIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Abertura</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode("carousel")}
            className={viewMode === "carousel" ? "active-mode" : ""}
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
          className="download-btn"
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
      <div className="carousel-grid">
        {/* Cover */}
        <div className="carousel-item" onClick={() => setCurrentPage(0)}>
          <div className="carousel-content">
            {renderBookCover()}
          </div>
          <div className="carousel-caption">Capa</div>
        </div>
        
        {/* Story pages */}
        {storyData.pages.map((_, index) => (
          <div 
            key={index}
            className="carousel-item"
            onClick={() => setCurrentPage(index + 1)}
          >
            <div className="carousel-content">
              {renderStoryPage(index)}
            </div>
            <div className="carousel-caption">Página {index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryViewer;
