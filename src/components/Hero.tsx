
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Book, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-100 pt-20">
      {/* Animated stars/sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              scale: Math.random() * 1.5 + 0.5,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 lg:gap-12">
          {/* Left side - Text content */}
          <div className="w-full md:w-1/2 text-left space-y-6 md:space-y-8 z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-indigo-800 leading-tight tracking-tight"
            >
              ACENDA<br />
              A IMAGINAÇÃO<br />
              DO SEU FILHO!
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-indigo-700/90 max-w-lg"
            >
              Crie histórias divertidas e personalizadas que dão vida
              às aventuras do seu filho e despertem sua paixão pela
              leitura. Leva apenas alguns segundos!
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <NavLink to="/create-story">
                <Button 
                  size="lg"
                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-full px-8 py-3 h-auto text-base"
                >
                  <Book className="mr-2 h-5 w-5" />
                  CRIAR HISTÓRIA
                </Button>
              </NavLink>
              
              <span className="text-indigo-700 font-medium ml-2">
                Experimente Grátis!
              </span>
            </motion.div>
          </div>
          
          {/* Right side - Fantasy Book Illustration without characters */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full md:w-1/2 flex justify-center items-center relative z-0"
          >
            <div className="relative w-full max-w-lg">
              <img 
                src="/lovable-uploads/c957b202-faa2-45c1-9fb5-e93af40aa4dd.png" 
                alt="Livro mágico com paisagens fantásticas e cenário de aventura" 
                className="w-full h-auto z-10 drop-shadow-xl"
              />
              
              {/* Animated elements */}
              <motion.div
                className="absolute -top-6 -right-2 w-12 h-12 text-yellow-400"
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Wand2 className="w-full h-full" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Bottom testimonial bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="w-full bg-indigo-700 py-4 mt-8"
      >
        <div className="container mx-auto px-4">
          <p className="text-white text-center text-sm md:text-base lg:text-lg">
            Junte-se a mais de 100.000 famílias usando o Story Spark para cultivar a paixão pela leitura.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
