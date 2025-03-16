
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface StoryData {
  title: string;
  content: string[];
  childImage: string | null;
  childName?: string;
  childAge?: string;
  theme?: string;
  setting?: string;
}

const StoryViewer = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const storyBookRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem("storyData");
    if (storedData) {
      setStoryData(JSON.parse(storedData));
    }
    
    // Simulate loading delay for animations
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const goToNextPage = () => {
    if (storyData && currentPage < storyData.content.length) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const getThemeColor = () => {
    switch (storyData?.theme) {
      case 'adventure': return 'from-blue-500 to-teal-500';
      case 'fantasy': return 'from-purple-500 to-pink-500';
      case 'space': return 'from-indigo-500 to-purple-500';
      case 'ocean': return 'from-blue-400 to-cyan-500';
      case 'dinosaurs': return 'from-green-500 to-yellow-500';
      default: return 'from-storysnap-blue to-storysnap-purple';
    }
  };

  const getThemeIcon = () => {
    switch (storyData?.theme) {
      case 'adventure':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 9-2 2" /><path d="m13 13-2 2" /><path d="m18 18-2 2" />
            <path d="M14.5 18.5 16 17l2 2 1.5-1.5-2-2 1.5-1.5-2-2-1.5 1.5 2 2-1.5 1.5Z" />
            <path d="M10 6 8.5 4.5 7 6l1.5 1.5L10 6Z" /><path d="M16 8.5 14.5 10l1.5 1.5 1.5-1.5-1.5-1.5Z" />
            <path d="m8.5 13.5-2-2L5 13l2 2 1.5-1.5Z" /><path d="M16.5 11.5 18 10l-2-2-1.5 1.5 2 2Z" />
          </svg>
        );
      case 'fantasy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m8 3 4 8 5-5" />
            <path d="M4 13h12" />
            <path d="M4 19h12" />
            <path d="M8 21v-8" />
            <path d="M12 21V11" />
            <path d="M16 21v-8" />
          </svg>
        );
      case 'space':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="21.17" y1="8" x2="12" y2="8" />
            <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
            <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
          </svg>
        );
      case 'ocean':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16h20" />
            <path d="M3 12h1c1 0 1-1 2-1s1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1h1" />
            <path d="M3 8h1c1 0 1-1 2-1s1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1.5 1 2.5 1" />
            <path d="M3 20h1c1 0 1-1 2-1s1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1 1-1 2-1 1 1 2 1h1" />
          </svg>
        );
      case 'dinosaurs':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-2.3 0-4.3-2-4.3-5.9S2 5 .7 5c-.7 0 7.3 2 7.3 6 0 .5-.3 1.5-1 1.5s-1-.5-1-1L4 8" />
            <path d="M5 15c0 1 0 2 2 2s5-1 5-3.5S9.5 9 7 9s-2.5.5-3 1" />
            <path d="M13 9s1-1 5 0 4.5 3.5 3 4 4 3 3 5-6 0-6-2" />
            <path d="M9 21v-3" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h4" />
            <path d="M7 7v6" />
            <path d="M17 7v6h4" />
            <path d="M21 13V7" />
            <path d="M12 7v6" />
            <path d="M12 13c-1.657 0-3 1.343-3 3v1" />
            <path d="M9 17h6" />
          </svg>
        );
    }
  };

  const downloadPDF = async () => {
    try {
      if (!storyBookRef.current) {
        toast.error("Não foi possível gerar o PDF. Tente novamente.");
        return;
      }
      
      // Switch to print mode
      setPrintMode(true);
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const storyElement = storyBookRef.current;
      const pages = storyElement.querySelectorAll('.book-page');
      
      let pdfWidth = pdf.internal.pageSize.getWidth();
      let pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Capture and add each page to PDF
      for (let i = 0; i < pages.length; i++) {
        try {
          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2,
            logging: false,
            useCORS: true
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          
          if (i > 0) {
            pdf.addPage();
          }
          
          // Calculate aspect ratio to fit page
          const canvasRatio = canvas.width / canvas.height;
          const pageRatio = pdfWidth / pdfHeight;
          
          let imgWidth, imgHeight;
          
          if (canvasRatio > pageRatio) {
            // Image is wider than the page ratio
            imgWidth = pdfWidth;
            imgHeight = pdfWidth / canvasRatio;
          } else {
            // Image is taller than the page ratio
            imgHeight = pdfHeight;
            imgWidth = pdfHeight * canvasRatio;
          }
          
          const xPosition = (pdfWidth - imgWidth) / 2;
          const yPosition = (pdfHeight - imgHeight) / 2;
          
          pdf.addImage(imgData, 'JPEG', xPosition, yPosition, imgWidth, imgHeight);
        } catch (err) {
          console.error(`Error capturing page ${i}:`, err);
        }
      }
      
      // Save the PDF
      pdf.save(`${storyData?.title || 'historia'}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      // Switch back from print mode
      setPrintMode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-storysnap-blue/30 border-t-storysnap-blue rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Carregando sua história...</p>
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="glass rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Nenhuma história encontrada</h2>
          <p className="text-muted-foreground mb-8">
            Parece que você ainda não criou uma história. Vamos criar uma agora?
          </p>
          <NavLink
            to="/create-story"
            className="inline-block px-6 py-3 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
          >
            Criar História
          </NavLink>
        </div>
      </div>
    );
  }

  // Handle normal viewing mode
  if (!printMode) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-8 md:p-12 shadow-xl"
        >
          {currentPage === 0 ? (
            // Cover page
            <motion.div
              key="cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className={`w-full h-64 md:h-80 rounded-xl mb-8 bg-gradient-to-r ${getThemeColor()} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                  <div className="text-white transform scale-[4] opacity-50">
                    {getThemeIcon()}
                  </div>
                </div>
                
                {storyData.childImage && (
                  <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg">
                    <img
                      src={storyData.childImage}
                      alt={storyData.childName || "Criança na história"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-storysnap-blue to-storysnap-purple bg-clip-text text-transparent">
                {storyData.title}
              </h1>
              
              {storyData.childName && (
                <p className="text-xl text-center mb-6">
                  Uma história de <span className="font-semibold">{storyData.childName}</span>
                  {storyData.childAge && `, ${storyData.childAge}`}
                </p>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextPage}
                className="px-6 py-3 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all flex items-center gap-2"
              >
                <span>Começar a Leitura</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </motion.button>
            </motion.div>
          ) : (
            // Story content pages
            <div className="flex flex-col md:flex-row gap-8 min-h-[400px]">
              <div className="flex-1 flex flex-col">
                <motion.div
                  key={`page-${currentPage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 prose prose-slate max-w-none pb-6"
                >
                  <p className="text-lg leading-relaxed">
                    {storyData.content[currentPage - 1]}
                  </p>
                </motion.div>

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {storyData.content.length + 1}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={goToPrevPage}
                      className="p-2 rounded-full text-slate-700 hover:bg-slate-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage > storyData.content.length}
                      className={`p-2 rounded-full ${
                        currentPage > storyData.content.length
                          ? "text-slate-300"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 flex flex-col gap-4">
                {storyData.childImage && (
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={storyData.childImage}
                      alt="Criança na história"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={downloadPDF}
                  className="w-full py-2 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Baixar PDF</span>
                </motion.button>

                <NavLink
                  to="/create-story"
                  className="w-full py-2 border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18" />
                    <path d="M12 3v18" />
                  </svg>
                  <span>Nova História</span>
                </NavLink>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }
  
  // Print mode view (for PDF generation)
  return (
    <div ref={storyBookRef} className="w-full">
      {/* Cover page */}
      <div className="book-page w-[210mm] h-[297mm] relative overflow-hidden flex flex-col items-center justify-center">
        <div className={`w-full h-[50%] bg-gradient-to-b ${getThemeColor()} flex items-center justify-center relative`}>
          {storyData.childImage && (
            <div className="relative z-10 w-40 h-40 rounded-full border-4 border-white overflow-hidden shadow-lg">
              <img
                src={storyData.childImage}
                alt={storyData.childName || "Criança na história"}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="absolute inset-0 opacity-20 flex items-center justify-center">
            <div className="text-white transform scale-[8] opacity-30">
              {getThemeIcon()}
            </div>
          </div>
        </div>
        
        <div className="w-full h-[50%] bg-white flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold text-center mb-6">
            {storyData.title}
          </h1>
          
          {storyData.childName && (
            <p className="text-2xl text-center mb-8">
              Uma história de <span className="font-semibold">{storyData.childName}</span>
              {storyData.childAge && `, ${storyData.childAge}`}
            </p>
          )}
          
          <p className="text-lg italic text-slate-500 text-center">
            Gerado por StorySnap
          </p>
        </div>
      </div>
      
      {/* Content pages */}
      {storyData.content.map((content, index) => (
        <div key={index} className="book-page w-[210mm] h-[297mm] p-16 flex flex-col">
          <div className="text-right mb-8">
            <span className="text-lg text-slate-500">Página {index + 1}</span>
          </div>
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-start mb-8">
              {storyData.childImage && index % 2 === 0 && (
                <div className="w-32 h-32 rounded-lg overflow-hidden shadow-md mr-6 float-left">
                  <img
                    src={storyData.childImage}
                    alt={storyData.childName || "Criança na história"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <p className="text-xl leading-relaxed">{content}</p>
              
              {storyData.childImage && index % 2 === 1 && (
                <div className="w-32 h-32 rounded-lg overflow-hidden shadow-md ml-6 float-right">
                  <img
                    src={storyData.childImage}
                    alt={storyData.childName || "Criança na história"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
            <div className="text-lg font-semibold">{storyData.childName}</div>
            <div>{storyData.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoryViewer;
