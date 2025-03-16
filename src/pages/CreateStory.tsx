
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StoryCreator from "../components/StoryCreator";
import { motion } from "framer-motion";

const CreateStory = () => {
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
              Criar História Personalizada
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Crie uma história mágica com seu filho como protagonista em apenas alguns passos simples.
            </p>
          </motion.div>
          
          <StoryCreator />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateStory;
