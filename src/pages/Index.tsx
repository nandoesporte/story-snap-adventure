
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
      </main>
      
      <footer className="py-8 px-4 border-t border-slate-200">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-sm text-muted-foreground text-center md:text-left"
            >
              &copy; 2024 StorySnap. Todos os direitos reservados.
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <a href="#" className="text-sm text-muted-foreground hover:text-storysnap-blue transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-storysnap-blue transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-storysnap-blue transition-colors">
                Contato
              </a>
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
