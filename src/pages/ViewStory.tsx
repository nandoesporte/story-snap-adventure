
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

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      
      {/* Fun decorative elements */}
      <div className="fixed top-40 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-30 blur-lg animate-float"></div>
      <div className="fixed bottom-40 right-20 w-32 h-32 bg-pink-200 rounded-full opacity-40 blur-lg animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="fixed top-60 right-40 w-16 h-16 bg-blue-200 rounded-full opacity-30 blur-lg animate-float" style={{ animationDelay: "1s" }}></div>
      <div className="fixed bottom-20 left-40 w-24 h-24 bg-green-200 rounded-full opacity-30 blur-lg animate-float" style={{ animationDelay: "3s" }}></div>
      
      {/* Floating shapes */}
      <div className="fixed top-80 left-1/4 w-12 h-12 cloud-shape opacity-40 animate-float" style={{ animationDelay: "2.5s" }}></div>
      <div className="fixed bottom-60 right-1/4 w-10 h-10 bg-yellow-300 rounded-star opacity-30 animate-float" style={{ animationDelay: "1.5s", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}></div>
      
      <main className="flex-1 pt-20 pb-16 relative z-10">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-purple-600 font-bubblegum relative inline-block childish-underline">
              Sua História Personalizada
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto font-comic text-lg">
              Aproveite esta história mágica criada especialmente para seu filho.
              Navegue pelas páginas ou baixe como um livro PDF para imprimir.
            </p>
          </motion.div>
          
          {/* Bookshelf effect with improved styling */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative mb-12 rounded-2xl overflow-hidden max-w-5xl mx-auto"
          >
            {/* Bookshelf top with fun patterns */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-amber-700 to-amber-600 rounded-t-2xl shadow-lg z-20 overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-stars-pattern"></div>
            </div>
            
            {/* Book environment */}
            <div className="pt-8 pb-6 bg-gradient-to-b from-amber-700 via-amber-600 to-amber-800 p-8 shadow-2xl">
              {/* Small decorative items on bookshelf */}
              <div className="absolute top-4 left-10 w-8 h-8 bg-blue-400 rounded-md opacity-80 z-10 transform -rotate-12"></div>
              <div className="absolute top-5 left-24 w-6 h-10 bg-green-600 rounded-sm opacity-80 z-10 transform rotate-6"></div>
              <div className="absolute top-3 right-32 w-10 h-5 bg-purple-600 rounded-sm opacity-80 z-10"></div>
              <div className="absolute top-4 right-16 w-7 h-7 bg-red-500 rounded-full opacity-80 z-10"></div>
              <div className="absolute top-3 right-48 w-12 h-3 bg-yellow-400 rounded-full opacity-80 z-10 transform -rotate-6"></div>
              
              {/* Main content: StoryViewer */}
              <div className="relative z-10">
                <StoryViewer />
              </div>
              
              {/* Bookshelf wood grain texture */}
              <div className="absolute inset-0 bg-repeat opacity-10" 
                style={{ 
                  backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+CiAgPHBhdGggZD0iTTAgMCBMIDMwIDMwIE0gMTUgMCBMIDMwIDE1IEwgMzAgMCBNIDAgMTUgTCAxNSAzMCBMIDAgMzAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBzdHJva2Utb3BhY2l0eT0iMC4xIi8+Cjwvc3ZnPg==')" 
                }}
              ></div>
            </div>
            
            {/* Bookshelf bottom with shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-amber-950 rounded-b-2xl shadow-inner"></div>
            
            {/* Bookshelf shadow */}
            <div className="absolute -bottom-5 left-2 right-2 h-5 bg-black opacity-20 blur-md rounded-full"></div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ViewStory;
