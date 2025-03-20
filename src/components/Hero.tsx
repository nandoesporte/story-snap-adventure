
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Book, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-blue-200 to-blue-100">
      {/* Stars scattered in the background */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-200 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
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

      <div className="container mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-8">
        {/* Left Side - Text Content */}
        <div className="w-full md:w-1/2 text-left space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold text-indigo-800 leading-tight"
          >
            ACENDA<br />
            A IMAGINAÇÃO<br />
            DO SEU FILHO!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-indigo-900 max-w-lg"
          >
            Crie histórias divertidas e personalizadas que dão vida
            às aventuras do seu filho e despertem sua paixão pela
            leitura. Leva apenas alguns segundos!
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 items-center"
          >
            <NavLink
              to="/create-story"
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 inline-flex items-center gap-2"
            >
              <Book size={20} />
              CRIAR HISTÓRIA
            </NavLink>
            
            <span className="text-indigo-700 font-medium">
              Experimente Grátis!
            </span>
          </motion.div>
        </div>
        
        {/* Right Side - Illustration */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full md:w-1/2 flex justify-center"
        >
          <div className="relative">
            {/* Open book with 3D world */}
            <img 
              src="/lovable-uploads/1dab797b-be42-4472-b092-238f718f6f0c.png" 
              alt="Livro mágico com personagens infantis e paisagens coloridas" 
              className="max-w-full h-auto z-10 relative"
            />
            
            {/* Animated floating elements */}
            <motion.div
              className="absolute w-12 h-12 top-10 right-10"
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="text-yellow-400 w-full h-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom testimonial bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="w-full bg-indigo-700/90 py-4 absolute bottom-0 left-0"
      >
        <div className="container mx-auto px-4">
          <p className="text-white text-center text-lg">
            Junte-se a 100.000 outras famílias usando o Story Spark para cultivar a paixão pela leitura de seus filhos.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
