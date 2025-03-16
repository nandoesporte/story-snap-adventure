
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      
      {/* Fun decorative elements - enhanced with more child-friendly elements */}
      <div className="fixed top-20 left-10 w-24 h-24 bg-yellow-200 rounded-full opacity-40 blur-lg animate-float"></div>
      <div className="fixed bottom-40 right-10 w-32 h-32 bg-pink-200 rounded-full opacity-50 blur-lg animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="fixed top-1/4 right-20 w-20 h-20 bg-blue-200 rounded-full opacity-40 blur-lg animate-float" style={{ animationDelay: "1s" }}></div>
      <div className="fixed bottom-20 left-40 w-28 h-28 bg-green-200 rounded-full opacity-40 blur-lg animate-float" style={{ animationDelay: "3s" }}></div>
      
      {/* Animated toys and childhood items */}
      <div className="fixed top-32 left-1/3 w-16 h-16 opacity-60 animate-float" style={{ 
        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmYTUwMCIgZD0iTTEyLDNDMTYuOTcsMyAyMSw3LjAzIDIxLDEyQzIxLDE2Ljk3IDE2Ljk3LDIxIDEyLDIxQzcuMDMsMjEgMywxNi45NyAzLDEyQzMsNy4wMyA3LjAzLDMgMTIsM00xMiw3QzEwLjM0Miw3IDkuNSw3Ljg0MiA5LjUsOUM5LjUsOS41NTEgOS42NzIsMTAuMDU3IDEwLDEwLjQxVjE1SDExVjEySDEzVjE1SDE0VjEwLjQwOEMxNC4zMjcsMTAuMDU1IDE0LjUsOS41NSAxNC41LDlDMTQuNSw3Ljg0MiAxMy42NTgsNyAxMiw3TTEyLDlDMTIuMjc2LDkgMTIuNSw5LjIyNCAxMi41LDlDMTIuNSw5LjI3NiAxMi4yNzYsOSAxMiw5WiIgLz48L3N2Zz4=')" 
      }}></div>
      <div className="fixed bottom-40 right-1/3 w-14 h-14 opacity-60 animate-float" style={{ 
        animationDelay: "1.5s",
        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzVjNmJjMCIgZD0iTTEyLDJDMTAuOSwyIDEwLDIuOSAxMCw0VjhDMTAsOS4xIDEwLjksMTAgMTIsMTBDMTMuMSwxMCAxNCw5LjEgMTQsOFY0QzE0LDIuOSAxMy4xLDIgMTIsMk0xMiwxMC41QzEyLDEwLjUgNSwxMC44IDUsMTlWMjBIM0E4LDggMCAwLDEgMTEsMTIuM1YxOWgySUYxMTUuNkExNi4yIDE2LjIgMCAwLDEgMTguNSwyLjY4IEdwFYzAuMywxLjExIDAuNywyLjI1IDEsMy4zOEMyMC41NCw5LjEyIDE5Ljc1LDExLjA4IDE5LDEyQzE5LDEyIDE5LjA4LDEyIDE5LjE2LDEyQzE5LjU2LDEyIDE5Ljk2LDEyIDE5Ljk2LDEyQzIxLDEyIDIyLjAyLDEyLjQyIDIyLjIyLDEzLjM5SDIyLjI3QzIxLjQsMTcuODIgMTguOCwyMCAyMiwyMEgyMlYyMkMxNi4xMywyMiAxMy4yMywxOC44MSAxMi41LDE1LjY2VjE1LjY2QzExLjMsMTkuOTEgNi43LDIyIDcsMjJWMjBIMThDMTguMDgsMTkuOTggMS43IEdwFYzAuMywxLjExIDAuNywyLjI1IDEsMy4zOEMyMC41NCw5LjEyIDE3LDIwIDE1LDIwIiwgY2xhc3M9Im1zdi1jdXN0b20tZWxlbWVudCIvPjwvc3ZnPg==')" 
      }}></div>
      
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
          
          {/* Bookshelf effect with improved styling for children */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative mb-12 rounded-2xl overflow-hidden max-w-5xl mx-auto"
          >
            {/* Bookshelf top with colorful child-friendly patterns */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-amber-600 to-amber-500 rounded-t-2xl shadow-lg z-20 overflow-hidden">
              <div className="flex items-center justify-around h-full">
                <div className="w-8 h-8 bg-red-400 rounded-full opacity-80"></div>
                <div className="w-8 h-8 bg-blue-400 rounded-full opacity-80"></div>
                <div className="w-8 h-8 bg-green-400 rounded-full opacity-80"></div>
                <div className="w-8 h-8 bg-yellow-400 rounded-full opacity-80"></div>
                <div className="w-8 h-8 bg-purple-400 rounded-full opacity-80"></div>
              </div>
            </div>
            
            {/* Book environment - redesigned for a more child-friendly look */}
            <div className="pt-10 pb-6 bg-gradient-to-b from-amber-600 via-amber-500 to-amber-700 p-8 shadow-2xl">
              {/* Small decorative items on bookshelf */}
              <div className="absolute top-14 left-10 w-10 h-10 bg-blue-400 rounded-md opacity-90 z-10 transform -rotate-12 border-2 border-white"></div>
              <div className="absolute top-12 left-28 w-8 h-12 bg-green-600 rounded-sm opacity-90 z-10 transform rotate-6 border-2 border-white"></div>
              <div className="absolute top-12 right-32 w-12 h-6 bg-purple-600 rounded-sm opacity-90 z-10 border-2 border-white"></div>
              <div className="absolute top-13 right-16 w-9 h-9 bg-red-500 rounded-full opacity-90 z-10 border-2 border-white"></div>
              <div className="absolute top-14 right-48 w-14 h-4 bg-yellow-400 rounded-full opacity-90 z-10 transform -rotate-6 border-2 border-white"></div>
              
              {/* Additional toy-like decorations */}
              <div className="absolute top-14 left-48 w-8 h-8 bg-teal-400 opacity-90 z-10" style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}></div>
              <div className="absolute top-16 right-72 w-10 h-10 bg-pink-400 rounded-lg opacity-90 z-10 transform rotate-45 border-2 border-white"></div>
              
              {/* Main content: StoryViewer */}
              <div className="relative z-10">
                <StoryViewer />
              </div>
              
              {/* Bookshelf wood grain texture - enhanced for more visual appeal */}
              <div className="absolute inset-0 bg-repeat opacity-20" 
                style={{ 
                  backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCI+CiAgPHBhdGggZD0iTTAgMCBMIDMwIDMwIE0gMTUgMCBMIDMwIDE1IEwgMzAgMCBNIDAgMTUgTCAxNSAzMCBMIDAgMzAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBzdHJva2Utb3BhY2l0eT0iMC4xNSIvPgo8L3N2Zz4=')" 
                }}
              ></div>
            </div>
            
            {/* Bookshelf bottom with shadow and decorative elements */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-amber-800 rounded-b-2xl shadow-inner">
              <div className="flex items-center justify-around h-full">
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
                <div className="w-4 h-4 bg-amber-950 rounded-full opacity-50"></div>
              </div>
            </div>
            
            {/* Bookshelf shadow - enhanced */}
            <div className="absolute -bottom-6 left-4 right-4 h-6 bg-black opacity-20 blur-md rounded-full"></div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ViewStory;
