
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

interface StoryData {
  title: string;
  content: string[];
  childImage: string | null;
}

const StoryViewer = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

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
    if (storyData && currentPage < storyData.content.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const downloadPDF = () => {
    // This is a placeholder for PDF generation functionality
    console.log("Downloading PDF...");
    // In a real implementation, you would generate and download a PDF here
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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-8 md:p-12 shadow-xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-storysnap-blue to-storysnap-purple bg-clip-text text-transparent">
            {storyData.title}
          </h1>
        </div>

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
                {storyData.content[currentPage]}
              </p>
            </motion.div>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
              <div className="text-sm text-muted-foreground">
                Página {currentPage + 1} de {storyData.content.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 0}
                  className={`p-2 rounded-full ${
                    currentPage === 0
                      ? "text-slate-300"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === storyData.content.length - 1}
                  className={`p-2 rounded-full ${
                    currentPage === storyData.content.length - 1
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
      </motion.div>
    </div>
  );
};

export default StoryViewer;
