
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryViewer from "../components/StoryViewer";
import { motion } from "framer-motion";

const ViewStory = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 bg-gradient-to-b from-purple-50 to-blue-50">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-purple-700 font-playfair">
              Sua História Personalizada
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Aproveite esta história mágica criada especialmente para seu filho.
              Navegue pelas páginas ou baixe como um livro PDF para imprimir.
            </p>
          </motion.div>
          
          {/* Decorative elements */}
          <div className="absolute top-40 left-10 w-20 h-20 bg-yellow-100 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-40 right-20 w-32 h-32 bg-pink-100 rounded-full opacity-30 blur-xl"></div>
          <div className="absolute top-60 right-40 w-16 h-16 bg-blue-100 rounded-full opacity-20 blur-xl"></div>
          
          {/* Bookshelf effect */}
          <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-amber-800 to-amber-700 p-8 shadow-xl max-w-5xl mx-auto">
            <div className="absolute top-0 left-0 right-0 h-2 bg-amber-900 rounded-t-2xl"></div>
            <div className="absolute bottom-0 left-0 right-0 h-3 bg-amber-950 shadow-inner"></div>
            
            <StoryViewer />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ViewStory;
