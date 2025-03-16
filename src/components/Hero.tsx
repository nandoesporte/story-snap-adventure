
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-storysnap-blue/20 blur-3xl"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-storysnap-purple/20 blur-3xl"
          animate={{ 
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 8,
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-storysnap-pink/20 blur-3xl"
          animate={{ 
            x: [0, 20, 0],
            y: [0, 20, 0],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 12,
            ease: "easeInOut" 
          }}
        />
      </div>

      <div className="container mx-auto max-w-5xl flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-2 mb-2"
        >
          <span className="inline-block text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            Histórias personalizadas para crianças
          </span>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-balance"
        >
          <span className="block">Transforme seu filho em</span>
          <span className="bg-gradient-to-r from-storysnap-blue via-storysnap-purple to-storysnap-pink bg-clip-text text-transparent">
            herói de histórias mágicas
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl text-balance"
        >
          Crie histórias infantis personalizadas com as fotos do seu filho. 
          Uma experiência única que transforma momentos em memórias inesquecíveis.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full sm:w-auto"
          >
            <NavLink
              to="/create-story"
              className="flex items-center justify-center w-full sm:w-auto px-8 py-3 font-medium text-white bg-storysnap-blue rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-storysnap-blue/90"
            >
              Criar História
            </NavLink>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Demo Image */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="w-full max-w-5xl mt-16 md:mt-20"
      >
        <div className="relative w-full aspect-[16/9] glass rounded-xl overflow-hidden shadow-2xl mx-auto">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Prévia do aplicativo
          </div>
        </div>
      </motion.div>
      
      {/* Features */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 mb-16"
      >
        <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-storysnap-blue/20 flex items-center justify-center text-storysnap-blue mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload de Fotos</h3>
          <p className="text-muted-foreground text-sm">
            Adicione fotos do seu filho para personalizarmos a história com elas
          </p>
        </div>
        
        <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-storysnap-purple/20 flex items-center justify-center text-storysnap-purple mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 7 7 17" />
              <path d="m7 7 10 10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Personalização</h3>
          <p className="text-muted-foreground text-sm">
            Escolha temas, personagens e cenários para tornar a história única
          </p>
        </div>
        
        <div className="glass rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-storysnap-pink/20 flex items-center justify-center text-storysnap-pink mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8" />
              <rect width="16" height="12" x="4" y="8" rx="2" />
              <path d="M2 14h2" />
              <path d="M20 14h2" />
              <path d="M15 13v2" />
              <path d="M9 13v2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Histórias Mágicas</h3>
          <p className="text-muted-foreground text-sm">
            Obtenha histórias encantadoras com seu filho como protagonista
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
