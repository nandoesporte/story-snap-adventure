
import Navbar from "../components/Navbar";
import StoryViewer from "../components/StoryViewer";
import { motion } from "framer-motion";

const ViewStory = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Sua História Personalizada
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Aproveite esta história mágica criada especialmente para seu filho.
            </p>
          </motion.div>
          
          <StoryViewer />
        </div>
      </main>
      
      <footer className="py-8 px-4 border-t border-slate-200">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              &copy; 2024 StorySnap. Todos os direitos reservados.
            </div>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-storysnap-blue transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-storysnap-blue transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-storysnap-blue transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ViewStory;
