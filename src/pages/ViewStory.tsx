
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryViewer from "../components/StoryViewer";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { customScrollbarStyles } from "../utils/cssStyles";

const ViewStory = () => {
  // Add custom scrollbar styles to the page
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = customScrollbarStyles;
    document.head.appendChild(styleElement);

    // Adiciona fontes infantis do Google
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Bubblegum+Sans&family=Patrick+Hand&family=Schoolbell&display=swap";
    document.head.appendChild(linkElement);

    return () => {
      document.head.removeChild(styleElement);
      document.head.removeChild(linkElement);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-pattern">
      <Navbar />
      
      <main className="flex-1 pt-16 pb-12 relative z-10">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-purple-600 font-bubblegum relative inline-block">
              <span className="relative z-10">Sua História Personalizada</span>
              <span className="absolute -bottom-2 left-0 right-0 h-4 bg-yellow-300 opacity-40 -z-10 transform -rotate-1 rounded-md"></span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto font-comic text-lg">
              Aproveite esta história mágica criada especialmente para seu filho.
              Navegue pelas páginas ou baixe como um livro PDF para imprimir.
            </p>
          </motion.div>
          
          {/* Real book appearance with better styling */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="book-container"
          >
            <StoryViewer />
          </motion.div>
        </div>
      </main>
      
      <Footer />

      {/* Add special book styling */}
      <style jsx global>{`
        .bg-pattern {
          background-color: #f8f9fa;
          background-image: url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .book-container {
          position: relative;
          padding: 30px;
          background: linear-gradient(135deg, #f6e6cb 0%, #f9f2e3 100%);
          border-radius: 10px;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.1),
            0 1px 3px rgba(0, 0, 0, 0.05),
            15px 15px 15px rgba(0, 0, 0, 0.05),
            -1px -1px 2px rgba(255, 255, 255, 0.5) inset;
          border: 1px solid rgba(222, 184, 135, 0.3);
          overflow: hidden;
        }
        
        .book-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to right, #e8b36d, #f3d7a8, #e8b36d);
          z-index: 3;
        }
        
        .book-container::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 30px;
          height: 100%;
          background: linear-gradient(to right, rgba(0,0,0,0.05), transparent);
          z-index: 2;
        }
      `}</style>
    </div>
  );
};

export default ViewStory;
