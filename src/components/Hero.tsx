
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Book, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface HeroProps {
  customImageUrl?: string;
}

const Hero = ({ customImageUrl }: HeroProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [preloadedImage, setPreloadedImage] = useState<HTMLImageElement | null>(null);
  
  // Fetch hero content from the database with better error handling
  const { data: heroContents = [] } = useQuery({
    queryKey: ["page-contents", "index", "hero"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page", "index")
        .eq("section", "hero");
      
      if (error) {
        console.error("Error fetching hero content:", error);
        return [];
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to improve performance
  });

  // Helper function to get content by key
  const getContent = (key: string, defaultValue: string = "") => {
    const content = heroContents.find(
      (item: any) => item.key === key
    );
    return content ? content.content : defaultValue;
  };

  // Default image if none provided - only set after heroContents is loaded
  const heroImage = customImageUrl || getContent("image_url", "");
  const imageAlt = getContent("image_alt", "Livro mágico com animais da floresta - raposa, guaxinim, coruja e balão de ar quente");

  // Preload the hero image
  useEffect(() => {
    if (heroImage) {
      const img = new Image();
      img.src = heroImage;
      img.onload = () => {
        setImageLoaded(true);
        setPreloadedImage(img);
      };
      // Set a timeout to show content even if image is slow
      const timeout = setTimeout(() => setImageLoaded(true), 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [heroImage]);

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
              {getContent("title_line1", "ACENDA")}<br />
              {getContent("title_line2", "A IMAGINAÇÃO")}<br />
              {getContent("title_line3", "DO SEU FILHO!")}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-indigo-700/90 max-w-lg"
            >
              {getContent("subtitle", "Crie histórias divertidas e personalizadas que dão vida às aventuras do seu filho e despertem sua paixão pela leitura. Leva apenas alguns segundos!")}
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
                  {getContent("button_text", "CRIAR HISTÓRIA")}
                </Button>
              </NavLink>
              
              <span className="text-indigo-700 font-medium ml-2">
                {getContent("button_subtitle", "Experimente Grátis!")}
              </span>
            </motion.div>
          </div>
          
          {/* Right side - Fantasy Book Illustration */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full md:w-1/2 flex justify-center items-center relative z-0"
          >
            {heroImage && (
              <div className="relative w-full max-w-lg">
                {imageLoaded ? (
                  <img 
                    src={heroImage}
                    alt={imageAlt}
                    className="w-full h-auto z-10 drop-shadow-xl"
                    loading="eager" 
                  />
                ) : (
                  <div className="w-full aspect-square bg-indigo-100 animate-pulse rounded-lg" />
                )}
                
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
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Bottom testimonial bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full bg-indigo-700 py-4 mt-8"
      >
        <div className="container mx-auto px-4">
          <p className="text-white text-center text-sm md:text-base lg:text-lg">
            {getContent("banner_text", "Junte-se a mais de 100.000 famílias usando o Story Spark para cultivar a paixão pela leitura.")}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
