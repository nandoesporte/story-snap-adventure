
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const isMobile = useIsMobile();
  
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
      
      {/* Imagem de Prévia com Alta Conversão */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="w-full max-w-5xl mt-12 md:mt-20 px-2 sm:px-4"
      >
        <div className="relative w-full glass rounded-xl overflow-hidden shadow-2xl mx-auto">
          <AspectRatio ratio={isMobile ? 3/4 : 16/9} className="bg-background/80">
            <div className="flex flex-col md:flex-row h-full">
              {/* Tela de dispositivo com nova imagem atrativa */}
              <div className="w-full md:w-3/5 h-full p-3 sm:p-4 md:p-8 flex items-center justify-center">
                <div className="relative w-full max-w-md mx-auto">
                  {/* Moldura de tablet/dispositivo */}
                  <div className="relative rounded-2xl overflow-hidden border-4 sm:border-8 border-gray-800 shadow-lg">
                    <AspectRatio ratio={isMobile ? 3/4 : 4/3}>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                      
                      {/* Imagem de criança como protagonista */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          {/* Cenário de aventura */}
                          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-indigo-600/20"></div>
                          
                          {/* Elementos mágicos */}
                          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-blue-400/30 to-transparent 
                                          flex items-start justify-center overflow-hidden">
                            <div className="w-full h-24 mt-2 relative">
                              {/* Estrelas e elementos mágicos */}
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-2 h-2 rounded-full bg-yellow-300"
                                  style={{
                                    left: `${10 + i * 20}%`,
                                    top: `${Math.random() * 100}%`,
                                  }}
                                  animate={{
                                    opacity: [0.4, 1, 0.4],
                                    scale: [0.8, 1.2, 0.8],
                                  }}
                                  transition={{
                                    duration: 2 + i % 3,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          
                          {/* Silhueta de castelo ao fundo */}
                          <div className="absolute inset-x-0 bottom-1/4 h-1/3 flex items-end justify-center">
                            <svg width="60%" height="80%" viewBox="0 0 100 50" className="text-indigo-900/30">
                              <path d="M10,50 L10,30 L15,30 L15,25 L20,25 L20,30 L25,30 L25,50 L35,50 L35,35 L40,35 L40,30 L45,30 L45,35 L50,25 L55,35 L55,30 L60,30 L60,35 L65,35 L65,50 L75,50 L75,30 L80,30 L80,25 L85,25 L85,30 L90,30 L90,50 Z" fill="currentColor" />
                            </svg>
                          </div>
                          
                          {/* Protagonista criança (silhueta com efeito mágico) */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-32 h-40">
                              {/* Silhueta da criança */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg viewBox="0 0 50 70" width="100%" height="100%" className="text-blue-900/70">
                                  <path d="M25,15 C30,15 34,19 34,24 C34,29 30,33 25,33 C20,33 16,29 16,24 C16,19 20,15 25,15 Z" fill="currentColor" />
                                  <path d="M15,33 L35,33 L38,65 C38,67 37,68 35,68 L30,68 L28,55 L25,68 L22,55 L20,68 L15,68 C13,68 12,67 12,65 Z" fill="currentColor" />
                                  <path d="M19,33 L12,45 M31,33 L38,45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              </div>
                              
                              {/* Efeito de brilho mágico ao redor da criança */}
                              <motion.div
                                className="absolute inset-0 rounded-full bg-storysnap-blue/10 blur-md"
                                animate={{
                                  scale: [1, 1.1, 1],
                                  opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Elementos dinossauros no tema */}
                          <div className="absolute bottom-4 left-4 w-16 h-12">
                            <svg viewBox="0 0 50 30" className="text-emerald-700/50">
                              <path d="M10,30 C5,30 0,25 0,20 C0,15 5,15 10,15 L15,15 C20,15 20,10 25,10 L30,5 L35,5 L40,10 L45,15 L48,20 L50,25 L45,30 Z" fill="currentColor" />
                              <circle cx="38" cy="14" r="1.5" fill="#000" fillOpacity="0.5" />
                            </svg>
                          </div>
                          
                          <div className="absolute bottom-4 right-4 w-14 h-10">
                            <svg viewBox="0 0 40 25" className="text-emerald-800/40">
                              <path d="M5,25 C3,25 0,22 0,18 C0,14 3,14 5,14 L10,14 C12,14 12,10 15,10 L20,5 L25,5 L28,10 L30,14 L32,18 L35,20 L30,25 Z" fill="currentColor" />
                              <circle cx="28" cy="12" r="1" fill="#000" fillOpacity="0.5" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Overlay de interface do app */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                          <h3 className="text-white text-sm sm:text-lg font-bold">A Aventura de Mateus</h3>
                          <p className="text-white/90 text-xs sm:text-sm">Uma jornada mágica no mundo dos dinossauros</p>
                        </div>
                      </div>
                    </AspectRatio>
                  </div>
                  {/* Botão de controle do dispositivo */}
                  <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-800"></div>
                </div>
              </div>
              
              {/* Texto de benefícios */}
              <div className="w-full md:w-2/5 p-4 sm:p-6 md:p-8 flex flex-col justify-center">
                <ul className="space-y-2 sm:space-y-4 text-left">
                  <li className="flex items-start gap-2 sm:gap-3">
                    <div className="rounded-full bg-storysnap-blue/20 p-1 mt-0.5 flex-shrink-0">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 text-storysnap-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm md:text-base">Histórias personalizadas com fotos reais do seu filho</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <div className="rounded-full bg-storysnap-purple/20 p-1 mt-0.5 flex-shrink-0">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 text-storysnap-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm md:text-base">Narrativas envolventes e educativas</span>
                  </li>
                  <li className="flex items-start gap-2 sm:gap-3">
                    <div className="rounded-full bg-storysnap-pink/20 p-1 mt-0.5 flex-shrink-0">
                      <svg className="h-3 w-3 sm:h-4 sm:w-4 text-storysnap-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm md:text-base">Compartilhe facilmente com família e amigos</span>
                  </li>
                </ul>
              </div>
            </div>
          </AspectRatio>
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
